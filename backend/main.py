"""水库AI - FastAPI 主应用

完整后端 API：认证、用户、模型、AI 调用、充值、消费记录。
所有 AI 调用与支付均为模拟（演示版本），但数据库、JWT、计费逻辑为真实实现。
"""
import re
import random
import secrets
from datetime import datetime, timedelta
from typing import Optional, List

from fastapi import FastAPI, HTTPException, Depends, status, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field, EmailStr
from sqlalchemy.orm import Session
from sqlalchemy import desc

import models as model_config
from database import (
    init_db, get_db, User, OTP, RechargeOrder, UsageRecord,
    generate_otp_code, generate_order_no, SessionLocal
)
from auth import (
    create_access_token, get_current_user, get_optional_user
)

# ============== 应用初始化 ==============

app = FastAPI(
    title="水库AI API",
    description="全球AI大模型聚合平台 - 后端API",
    version="1.0.0-demo",
)

# CORS（演示版本开放跨域，方便前端调用）
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    init_db()
    print("[ReservoirAI] 数据库初始化完成")


# ============== Pydantic Models ==============

class RegisterRequest(BaseModel):
    identifier: str = Field(..., description="邮箱或手机号")
    identifier_type: str = Field(..., description="'email' or 'phone'")


class RequestOtpRequest(BaseModel):
    identifier: str
    identifier_type: str
    purpose: str = "login"  # login / register


class VerifyOtpRequest(BaseModel):
    identifier: str
    code: str
    purpose: str = "login"


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


class ChatMessage(BaseModel):
    role: str  # 'user' or 'assistant'
    content: str


class ChatCompletionRequest(BaseModel):
    model: str
    messages: List[ChatMessage]
    temperature: float = 0.7


class ImageGenerationRequest(BaseModel):
    model: str
    prompt: str
    resolution: Optional[str] = None
    n: int = 1


class RechargeCreateRequest(BaseModel):
    amount_cny: float = Field(..., gt=0)
    package_name: Optional[str] = None


class RechargeVerifyRequest(BaseModel):
    order_no: str
    # 演示版本：模拟支付回调总是成功
    simulate: bool = True


# ============== 工具函数 ==============

EMAIL_RE = re.compile(r"^[\w.+-]+@[\w-]+\.[\w.-]+$")
PHONE_RE = re.compile(r"^1[3-9]\d{9}$")


def validate_identifier(identifier: str, identifier_type: str) -> bool:
    if identifier_type == "email":
        return bool(EMAIL_RE.match(identifier))
    elif identifier_type == "phone":
        return bool(PHONE_RE.match(identifier))
    return False


def user_to_dict(user: User) -> dict:
    return {
        "id": user.id,
        "identifier": user.identifier,
        "identifier_type": user.identifier_type,
        "nickname": user.nickname or (user.identifier.split("@")[0] if "@" in user.identifier else user.identifier[:6]),
        "balance": user.balance,
        "total_spent": user.total_spent,
        "total_calls": user.total_calls,
        "created_at": user.created_at.isoformat() if user.created_at else None,
        "last_login": user.last_login.isoformat() if user.last_login else None,
    }


# ============== 认证相关 ==============

@app.post("/api/auth/register")
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    """注册（演示版本）：校验格式后直接创建用户（实际产品应先走 OTP）"""
    if req.identifier_type not in ("email", "phone"):
        raise HTTPException(400, "identifier_type 必须为 email 或 phone")
    if not validate_identifier(req.identifier, req.identifier_type):
        raise HTTPException(400, "邮箱/手机号格式不正确")

    existing = db.query(User).filter(User.identifier == req.identifier).first()
    if existing:
        raise HTTPException(400, "该邮箱/手机号已注册")

    user = User(
        identifier=req.identifier,
        identifier_type=req.identifier_type,
        nickname=req.identifier.split("@")[0] if "@" in req.identifier else f"用户{req.identifier[-4:]}",
        balance=5000,  # 新用户赠送 5000 token
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(user.id, user.identifier)
    return {
        "message": "注册成功",
        "access_token": token,
        "token_type": "bearer",
        "user": user_to_dict(user),
    }


@app.post("/api/auth/login-otp")
def request_otp(req: RequestOtpRequest, db: Session = Depends(get_db)):
    """申请 OTP 验证码（演示版本：直接返回 6 位码到响应中）"""
    if req.identifier_type not in ("email", "phone"):
        raise HTTPException(400, "identifier_type 必须为 email 或 phone")
    if not validate_identifier(req.identifier, req.identifier_type):
        raise HTTPException(400, "邮箱/手机号格式不正确")

    # 检查用户是否存在（登录场景）
    user = db.query(User).filter(User.identifier == req.identifier).first()
    if req.purpose == "login" and not user:
        raise HTTPException(404, "该账户未注册，请先注册")
    if req.purpose == "register" and user:
        raise HTTPException(400, "该账户已注册，请直接登录")

    code = generate_otp_code()
    expires = datetime.utcnow() + timedelta(minutes=5)
    otp = OTP(
        identifier=req.identifier,
        code=code,
        purpose=req.purpose,
        expires_at=expires,
    )
    db.add(otp)
    db.commit()

    # 演示版本：直接返回验证码（真实场景应通过邮件/短信发送）
    return {
        "message": f"验证码已发送（演示：沙箱直接返回）",
        "demo_code": code,  # 演示用：前端可读取
        "expires_in": 300,
        "identifier": req.identifier,
    }


@app.post("/api/auth/verify-otp")
def verify_otp(req: VerifyOtpRequest, db: Session = Depends(get_db)):
    """验证 OTP，返回 JWT"""
    # 查找最新一条未使用的 OTP
    otp = db.query(OTP).filter(
        OTP.identifier == req.identifier,
        OTP.purpose == req.purpose,
        OTP.used == False,
    ).order_by(desc(OTP.created_at)).first()

    if not otp:
        raise HTTPException(400, "请先获取验证码")
    if otp.expires_at < datetime.utcnow():
        raise HTTPException(400, "验证码已过期，请重新获取")
    if otp.code != req.code:
        raise HTTPException(400, "验证码不正确")

    otp.used = True

    user = db.query(User).filter(User.identifier == req.identifier).first()
    if not user:
        raise HTTPException(404, "用户不存在，请先注册")

    user.last_login = datetime.utcnow()
    db.commit()

    token = create_access_token(user.id, user.identifier)
    return {
        "message": "登录成功",
        "access_token": token,
        "token_type": "bearer",
        "user": user_to_dict(user),
    }


# ============== 用户相关 ==============

@app.get("/api/user/me")
def get_me(current_user: User = Depends(get_current_user)):
    return {"user": user_to_dict(current_user)}


@app.get("/api/user/balance")
def get_balance(current_user: User = Depends(get_current_user)):
    return {
        "balance": current_user.balance,
        "total_spent": current_user.total_spent,
        "total_calls": current_user.total_calls,
    }


# ============== 模型相关 ==============

@app.get("/api/models")
def list_models(
    category: Optional[str] = Query(None, description="text / image"),
    current_user: Optional[User] = Depends(get_optional_user),
):
    if category == "text":
        return {"models": model_config.list_text_models()}
    elif category == "image":
        return {"models": model_config.list_image_models()}
    return {"models": model_config.list_all_models()}


@app.get("/api/models/{model_id}")
def get_model_detail(model_id: str):
    m = model_config.get_model(model_id)
    if not m:
        raise HTTPException(404, "模型不存在")
    return {"model": m}


# ============== AI 调用 ==============

@app.post("/api/chat/completions")
def chat_completions(
    req: ChatCompletionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """模拟文本对话：按 input+output token 计费"""
    model = model_config.get_model(req.model)
    if not model:
        raise HTTPException(404, "模型不存在")
    if model["category"] != "text":
        raise HTTPException(400, "该模型不支持文本对话")

    # 计算 input tokens
    input_text = "\n".join([m.content for m in req.messages])
    input_tokens = model_config.estimate_text_tokens(input_text)

    # 模拟生成回复
    templates = model_config.TEXT_RESPONSE_TEMPLATES.get(req.model, [
        f"这是 {model['name']} 的模拟回复（演示版本）。\n\n我理解你的问题是关于 AI 系统的设计。\n\n建议从简单开始，逐步迭代。",
    ])
    reply = random.choice(templates)
    output_tokens = model_config.estimate_text_tokens(reply)

    # 计算费用（演示版本：input_price/output_price 单位为 token/千 token）
    cost_tokens = int(
        (input_tokens * model["input_price"] + output_tokens * model["output_price"]) / 1000
    )
    # 保证至少扣 1 token（演示）
    cost_tokens = max(1, cost_tokens)

    if current_user.balance < cost_tokens:
        # 余额不足，不扣费
        record = UsageRecord(
            user_id=current_user.id,
            model_id=req.model,
            model_name=model["name"],
            call_type="text",
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            total_tokens=input_tokens + output_tokens,
            cost_tokens=cost_tokens,
            prompt_preview=input_text[:200],
            result_preview="[余额不足，调用未执行]",
            status="failed",
        )
        db.add(record)
        db.commit()
        raise HTTPException(
            status_code=402,
            detail={
                "error": "insufficient_balance",
                "message": f"余额不足，需要 {cost_tokens} token，当前余额 {current_user.balance}",
                "required": cost_tokens,
                "current": current_user.balance,
            }
        )

    # 扣费
    current_user.balance -= cost_tokens
    current_user.total_spent += cost_tokens
    current_user.total_calls += 1

    # 写日志
    record = UsageRecord(
        user_id=current_user.id,
        model_id=req.model,
        model_name=model["name"],
        call_type="text",
        input_tokens=input_tokens,
        output_tokens=output_tokens,
        total_tokens=input_tokens + output_tokens,
        cost_tokens=cost_tokens,
        prompt_preview=input_text[:200],
        result_preview=reply[:500],
        status="success",
    )
    db.add(record)
    db.commit()

    return {
        "model": req.model,
        "reply": reply,
        "usage": {
            "input_tokens": input_tokens,
            "output_tokens": output_tokens,
            "total_tokens": input_tokens + output_tokens,
            "cost_tokens": cost_tokens,
        },
        "balance_after": current_user.balance,
    }


@app.post("/api/image/generations")
def image_generations(
    req: ImageGenerationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """模拟图像生成：按次计费"""
    model = model_config.get_model(req.model)
    if not model:
        raise HTTPException(404, "模型不存在")
    if model["category"] != "image":
        raise HTTPException(400, "该模型不支持图像生成")
    if not req.prompt or len(req.prompt.strip()) < 2:
        raise HTTPException(400, "请输入有效的提示词")

    n = max(1, min(req.n, 4))
    resolution = req.resolution or model.get("default_resolution", "1024x1024")
    cost_tokens = model["price_per_image"] * n

    if current_user.balance < cost_tokens:
        record = UsageRecord(
            user_id=current_user.id,
            model_id=req.model,
            model_name=model["name"],
            call_type="image",
            input_tokens=0,
            output_tokens=n,
            total_tokens=n,
            cost_tokens=cost_tokens,
            prompt_preview=req.prompt[:200],
            result_preview="[余额不足，调用未执行]",
            status="failed",
        )
        db.add(record)
        db.commit()
        raise HTTPException(
            status_code=402,
            detail={
                "error": "insufficient_balance",
                "message": f"余额不足，需要 {cost_tokens} token，当前余额 {current_user.balance}",
                "required": cost_tokens,
                "current": current_user.balance,
            }
        )

    # 扣费
    current_user.balance -= cost_tokens
    current_user.total_spent += cost_tokens
    current_user.total_calls += n

    # 生成占位图（用 picsum.photos，每个提示词对应一张确定性图片）
    seed_str = req.prompt[:32]
    seed = abs(hash(seed_str)) % 100000
    images = []
    for i in range(n):
        images.append({
            "url": f"https://picsum.photos/seed/{seed + i}/1024/1024",
            "width": 1024,
            "height": 1024,
        })

    # 主图 URL（单图模式下取第一张）
    main_image_url = images[0]["url"]

    record = UsageRecord(
        user_id=current_user.id,
        model_id=req.model,
        model_name=model["name"],
        call_type="image",
        input_tokens=0,
        output_tokens=n,
        total_tokens=n,
        cost_tokens=cost_tokens,
        prompt_preview=req.prompt[:200],
        result_preview=f"生成 {n} 张图像",
        image_url=main_image_url,
        status="success",
    )
    db.add(record)
    db.commit()

    return {
        "model": req.model,
        "prompt": req.prompt,
        "resolution": resolution,
        "n": n,
        "images": images,
        "usage": {
            "total_tokens": n,
            "cost_tokens": cost_tokens,
        },
        "balance_after": current_user.balance,
    }


# ============== 充值 ==============

# 充值套餐配置
RECHARGE_PACKAGES = [
    {"name": "入门版", "amount_cny": 10, "token_amount": 10000, "tag": "体验首选"},
    {"name": "标准版", "amount_cny": 50, "token_amount": 55000, "tag": "人气推荐", "highlight": True},
    {"name": "专业版", "amount_cny": 200, "token_amount": 240000, "tag": "高性价比"},
    {"name": "企业版", "amount_cny": 1000, "token_amount": 1300000, "tag": "团队首选"},
]

# 自定义金额 -> token 兑换比例（1 元 = 1000 token）
CUSTOM_RATE = 1000


@app.get("/api/recharge/packages")
def list_packages():
    """获取充值套餐列表"""
    return {"packages": RECHARGE_PACKAGES, "custom_rate": CUSTOM_RATE}


@app.post("/api/recharge/create")
def create_recharge(
    req: RechargeCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """创建充值订单"""
    if req.amount_cny <= 0:
        raise HTTPException(400, "金额必须大于 0")
    if req.amount_cny > 100000:
        raise HTTPException(400, "单次充值金额不能超过 100000 元")

    # 根据金额匹配套餐或自定义
    matched_package = None
    for pkg in RECHARGE_PACKAGES:
        if req.package_name == pkg["name"] or req.amount_cny == pkg["amount_cny"]:
            matched_package = pkg
            break

    if matched_package:
        token_amount = matched_package["token_amount"]
        package_name = matched_package["name"]
    else:
        token_amount = int(req.amount_cny * CUSTOM_RATE)
        package_name = "自定义"

    order = RechargeOrder(
        order_no=generate_order_no(),
        user_id=current_user.id,
        amount_cny=req.amount_cny,
        token_amount=token_amount,
        package_name=package_name,
        status="pending",
    )
    db.add(order)
    db.commit()
    db.refresh(order)

    return {
        "order_no": order.order_no,
        "amount_cny": order.amount_cny,
        "token_amount": order.token_amount,
        "package_name": order.package_name,
        "status": order.status,
        "payment_url": f"/api/recharge/pay/{order.order_no}",  # 演示用
    }


@app.post("/api/recharge/verify")
def verify_recharge(
    req: RechargeVerifyRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """模拟支付回调（演示版本：点击即到账）"""
    order = db.query(RechargeOrder).filter(
        RechargeOrder.order_no == req.order_no,
        RechargeOrder.user_id == current_user.id,
    ).first()
    if not order:
        raise HTTPException(404, "订单不存在")
    if order.status == "paid":
        return {"message": "订单已支付", "order_no": order.order_no, "status": "paid"}

    # 演示版本：模拟 95% 成功率
    if not req.simulate and random.random() > 0.95:
        order.status = "failed"
        db.commit()
        raise HTTPException(400, "支付失败，请重试")

    # 标记成功，发放 token
    order.status = "paid"
    order.paid_at = datetime.utcnow()
    current_user.balance += order.token_amount
    db.commit()

    return {
        "message": "支付成功",
        "order_no": order.order_no,
        "amount_cny": order.amount_cny,
        "token_amount": order.token_amount,
        "balance_after": current_user.balance,
    }


# ============== 记录查询 ==============

@app.get("/api/usage/records")
def usage_records(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """消费记录"""
    total = db.query(UsageRecord).filter(UsageRecord.user_id == current_user.id).count()
    records = db.query(UsageRecord).filter(
        UsageRecord.user_id == current_user.id
    ).order_by(desc(UsageRecord.created_at)).offset(
        (page - 1) * page_size
    ).limit(page_size).all()

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "records": [
            {
                "id": r.id,
                "model_id": r.model_id,
                "model_name": r.model_name,
                "call_type": r.call_type,
                "input_tokens": r.input_tokens,
                "output_tokens": r.output_tokens,
                "total_tokens": r.total_tokens,
                "cost_tokens": r.cost_tokens,
                "prompt_preview": r.prompt_preview,
                "result_preview": r.result_preview,
                "image_url": r.image_url,
                "status": r.status,
                "created_at": r.created_at.isoformat(),
            }
            for r in records
        ]
    }


@app.get("/api/recharge/records")
def recharge_records(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """充值记录"""
    total = db.query(RechargeOrder).filter(RechargeOrder.user_id == current_user.id).count()
    records = db.query(RechargeOrder).filter(
        RechargeOrder.user_id == current_user.id
    ).order_by(desc(RechargeOrder.created_at)).offset(
        (page - 1) * page_size
    ).limit(page_size).all()

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "records": [
            {
                "id": r.id,
                "order_no": r.order_no,
                "amount_cny": r.amount_cny,
                "token_amount": r.token_amount,
                "package_name": r.package_name,
                "status": r.status,
                "payment_method": r.payment_method,
                "created_at": r.created_at.isoformat(),
                "paid_at": r.paid_at.isoformat() if r.paid_at else None,
            }
            for r in records
        ]
    }


# ============== 健康检查 ==============

@app.get("/api/health")
def health():
    return {"status": "ok", "service": "水库AI API", "version": "1.0.0-demo"}


@app.get("/")
def root():
    return {
        "service": "水库AI API",
        "version": "1.0.0-demo",
        "docs": "/docs",
        "health": "/api/health",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

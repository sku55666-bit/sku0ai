"""水库AI - SQLite 数据库模块

使用 SQLAlchemy + SQLite，提供用户、余额、订单、调用日志等持久化。
"""
from datetime import datetime, timedelta
from sqlalchemy import (
    create_engine, Column, Integer, String, DateTime, Float, Text, Boolean, ForeignKey
)
from sqlalchemy.orm import declarative_base, sessionmaker, relationship
import hashlib
import secrets

DATABASE_URL = "sqlite:///./reservoir_ai.db"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
    echo=False,
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


# ============== 模型定义 ==============

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    # identifier: 邮箱或手机号
    identifier = Column(String(128), unique=True, index=True, nullable=False)
    identifier_type = Column(String(16), nullable=False)  # 'email' or 'phone'
    nickname = Column(String(64), nullable=True)
    avatar = Column(String(256), nullable=True)
    # 初始赠送 token，演示用
    balance = Column(Integer, default=5000, nullable=False)
    total_spent = Column(Integer, default=0, nullable=False)
    total_calls = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    last_login = Column(DateTime, nullable=True)


class OTP(Base):
    __tablename__ = "otps"
    id = Column(Integer, primary_key=True, index=True)
    identifier = Column(String(128), index=True, nullable=False)
    code = Column(String(6), nullable=False)
    purpose = Column(String(32), default="login", nullable=False)  # login / register
    used = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    expires_at = Column(DateTime, nullable=False)


class RechargeOrder(Base):
    __tablename__ = "recharge_orders"
    id = Column(Integer, primary_key=True, index=True)
    order_no = Column(String(64), unique=True, index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    amount_cny = Column(Float, nullable=False)  # 充值人民币金额
    token_amount = Column(Integer, nullable=False)  # 获得 token 数量
    package_name = Column(String(64), nullable=True)  # 套餐名
    status = Column(String(16), default="pending", nullable=False)  # pending / paid / failed
    payment_method = Column(String(16), default="alipay", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    paid_at = Column(DateTime, nullable=True)

    user = relationship("User", backref="orders")


class UsageRecord(Base):
    __tablename__ = "usage_records"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    model_id = Column(String(64), nullable=False)
    model_name = Column(String(64), nullable=False)
    call_type = Column(String(16), nullable=False)  # 'text' or 'image'
    input_tokens = Column(Integer, default=0, nullable=False)
    output_tokens = Column(Integer, default=0, nullable=False)
    total_tokens = Column(Integer, nullable=False)  # 实际消耗 token
    cost_tokens = Column(Integer, nullable=False)  # 计费 token
    prompt_preview = Column(String(256), nullable=True)
    result_preview = Column(String(512), nullable=True)
    image_url = Column(String(512), nullable=True)
    status = Column(String(16), default="success", nullable=False)  # success / failed
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", backref="usages")


# ============== 工具函数 ==============

def init_db():
    """创建所有表"""
    Base.metadata.create_all(bind=engine)


def get_db():
    """FastAPI 依赖项：获取数据库 session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def generate_otp_code() -> str:
    """生成 6 位 OTP 码"""
    return f"{secrets.randbelow(1000000):06d}"


def generate_order_no() -> str:
    """生成订单号"""
    ts = datetime.utcnow().strftime("%Y%m%d%H%M%S")
    rand = secrets.token_hex(4).upper()
    return f"RC{ts}{rand}"


def hash_identifier(identifier: str) -> str:
    """对邮箱/手机号做不可逆 hash（演示用）"""
    return hashlib.sha256(identifier.lower().encode()).hexdigest()[:16]

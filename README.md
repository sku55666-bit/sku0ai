# 水库AI - 全球AI大模型聚合平台

> 一个完整的 AI 聚合平台 Web 应用，集成 8 个主流 AI 模型，统一 Token 计费，一站调用。

## 演示版本说明

**本项目为演示版本（Demo）**：

- ✅ 完整 UI / UX / 业务流程
- ✅ 完整数据库、用户、订单、Token 计费逻辑
- ✅ 真实 JWT 认证、邮箱/手机号 OTP 流程
- ⚠️ **AI 调用为预设回复模板生成**（不调用真实 API）
- ⚠️ **支付为点击即到账**（不接入真实支付通道）
- ⚠️ **验证码不真发邮件/短信**（沙箱直接返回到响应中）

切换到生产版本时，只需替换 `backend/main.py` 中的 AI 调用函数与支付回调为真实接口即可。

---

## 项目结构

```
shuiku-ai/
├── frontend/                    # 前端（6 页面 SPA）
│   ├── index.html              # 主入口（含页面专属样式）
│   ├── css/
│   │   └── main.css            # 全局样式（深色科技风 + 响应式）
│   └── js/
│       ├── api.js              # 客户端 API 模拟层（localStorage 持久化）
│       ├── ui.js               # 工具函数（Toast、Modal、动画）
│       ├── app.js              # 主应用入口（路由）
│       └── page-*.js           # 6 个页面实现
│
├── backend/                     # FastAPI 真实后端骨架
│   ├── main.py                 # FastAPI 主应用
│   ├── models.py               # AI 模型配置中心
│   ├── database.py             # SQLAlchemy + SQLite ORM
│   ├── auth.py                 # JWT 认证模块
│   ├── requirements.txt        # 依赖
│   └── reservoir_ai.db         # SQLite 数据库（自动生成）
│
├── screenshots/                 # 31 张关键页面截图
│   ├── 01-home-desktop.png
│   ├── 02-market-desktop.png
│   ├── ...
│   └── 20-profile-mobile.png
│
├── start.sh                    # 一键启动脚本
└── README.md                   # 本文件
```

---

## 一键启动

### 方式一：使用启动脚本

```bash
# 在项目根目录执行
./start.sh
```

脚本会自动：
1. 检查并安装后端依赖
2. 启动 FastAPI 后端（端口 8000）
3. 启动前端 HTTP 服务（端口 8888）
4. 输出可访问地址

### 方式二：分别启动

#### 启动后端

```bash
cd backend
pip install -r requirements.txt
python3 main.py
# → http://localhost:8000
# → API 文档：http://localhost:8000/docs
```

#### 启动前端（任选其一）

```bash
# 方式 A：Python 内置 HTTP 服务
cd frontend
python3 -m http.server 8888
# → http://localhost:8888

# 方式 B：直接用浏览器打开
open frontend/index.html   # macOS
xdg-open frontend/index.html  # Linux
```

> ⚠️ 由于浏览器安全限制，建议使用 HTTP 服务访问，不要直接 file:// 打开。

### 方式三：访问妙搭部署版本

直接访问妙搭提供的 URL（见交付物链接），无需任何本地启动。

---

## 演示账号

| 渠道 | 标识 | 密码 |
|------|------|------|
| 邮箱 | `demo@reservoir.ai` | OTP 登录（自动填入） |
| 手机 | 任意符合 1[3-9]xxxxxxxxx 格式 | OTP 登录（自动填入） |

> **首次使用**：直接在注册页输入邮箱/手机号，OTP 验证码会在弹窗中直接显示，**演示版本不会真发邮件/短信**。点「立即注册」即可完成注册（自动赠送 5000 token）。

> **重置演示数据**：进入「个人中心」→ 「账户设置」→ 「重置演示数据」。

---

## 功能列表

### 6 大页面（按 PRD 4.1）

1. **首页** - Hero 区 + 模型展示网格 + 三步引导 + 底部 CTA
2. **模型市场** - 8 个模型按文本/图像分类 Tab 展示，含 Token 消耗说明
3. **AI 对话/生成页** - 左右分栏，支持文本对话和图像生成两种模式
4. **充值页** - 4 档套餐（入门/标准/专业/企业）+ 自定义金额
5. **登录/注册页** - 邮箱 OTP + 短信 OTP 双通道
6. **个人中心** - 账户概览 + 消费/充值/设置 三个 Tab

### 8 个 AI 模型

#### 文本对话（4 个）

| 模型 | 提供方 | 输入单价 | 输出单价 |
|------|--------|---------|---------|
| GPT-5.5 | OpenAI | 15/千token | 45/千token |
| Claude Opus 4 | Anthropic | 20/千token | 60/千token |
| Gemini-Omni Pro | Google | 8/千token | 24/千token |
| Grok 3 | xAI | 12/千token | 36/千token |

#### 图像生成（4 个）

| 模型 | 提供方 | 单价 |
|------|--------|------|
| 即梦 3.0 | 字节跳动 | 800 token/张 |
| 可灵 1.6 | 快手 | 900 token/张 |
| Image SDXL | Stability | 500 token/张 |
| Banana Pro | Google DeepMind | 400 token/张 |

---

## 后端 API 列表

所有接口前缀 `/api`，完整文档访问 `http://localhost:8000/docs`

### 认证

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/auth/register` | 邮箱/手机号注册 |
| POST | `/auth/login-otp` | 申请 OTP（沙箱直接返回验证码） |
| POST | `/auth/verify-otp` | 验证 OTP，返回 JWT |

### 用户

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/user/me` | 获取当前用户信息 |
| GET | `/user/balance` | 获取 Token 余额 |

### 模型

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/models` | 获取模型列表（可按 category=text/image 过滤） |
| GET | `/models/{id}` | 获取单个模型详情 |

### AI 调用

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/chat/completions` | 模拟文本对话（按 input+output token 计费） |
| POST | `/image/generations` | 模拟图像生成（按次/分辨率计费） |

### 充值

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/recharge/packages` | 获取充值套餐列表 |
| POST | `/recharge/create` | 创建充值订单 |
| POST | `/recharge/verify` | 模拟支付回调（演示版本直接到账） |

### 记录

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/usage/records` | 消费记录（分页） |
| GET | `/recharge/records` | 充值记录（分页） |

---

## 视觉规范（严格按 PRD 第五章）

### 色彩方案

```
主背景     #0A1628  深蓝黑
次背景     #1E293B  深灰蓝
主色       #3B82F6  科技蓝
强调色     #06B6D4  青色
成功       #10B981  翠绿
错误       #EF4444  红色
警告       #F59E0B  琥珀
主文字     #F1F5F9  近白
次文字     #94A3B8  灰蓝
弱文字     #64748B  深灰蓝
```

### 字号层级

```
H1  48px / 800 字重
H2  32px / 700 字重
H3  24px / 700 字重
正文 16px
辅助 14px / 12px
数字  JetBrains Mono 等宽
```

### 动效规范

```
缓动函数   cubic-bezier(0.4, 0, 0.2, 1)
快速反馈   150-250ms
状态切换   300-500ms
hover 上浮  4px
卡片缩放    1.01-1.03
淡入      200ms
粒子背景   12s 低频微动
```

### 设计语言

- Glassmorphism 卡片（半透明 + 背景模糊）
- 深色科技渐变（径向渐变 + 线性渐变）
- 微光粒子背景（仅首页/Auth 页）
- 渐变文字标题（白→蓝→青）

---

## 响应式断点

| 设备 | 断点 | 适配 |
|------|------|------|
| 移动端 | < 768px | 底部 Tab 导航、模型折叠为横向滚动、单列布局 |
| 平板 | 768-1023px | 缩小字号、左右分栏比例调整 |
| 桌面端 | ≥ 1024px | 完整左右分栏、顶部导航 |

---

## 核心交互细节

### AI 调用反馈

- **调用中**：loading 旋转 + "AI 正在生成..." 状态文字
- **成功**：结果 + Token 消耗 + 剩余余额（数字滚动动画）
- **失败**：红色提示 + 重试按钮
- **余额不足**：橙色提示 + 跳转充值入口（弹窗确认）

### 充值反馈

- **支付中**：按钮 disabled + 状态文字
- **成功**：绿色对勾缩放出现 + 余额数字滚动更新
- **失败**：红色提示 + 重新支付按钮

### 余额变化

- 数字从旧值滚动到新值（600ms ease-out-cubic）
- 颜色闪烁（绿色：充值成功；红色：扣费）

### 模型卡片 hover

- 上浮 4px
- 边框由灰色渐变到主色
- 阴影加深

---

## Token 计费逻辑

### 文本对话

```python
cost_tokens = max(1, int(
    (input_tokens * input_price + output_tokens * output_price) / 1000
))
```

举例（GPT-5.5）：
- 输入 1000 token + 输出 500 token
- cost = (1000 × 15 + 500 × 45) / 1000 = (15000 + 22500) / 1000 = 37.5
- 实际扣 38 token

### 图像生成

```python
cost_tokens = price_per_image * n
```

举例（即梦 3.0，1 张 1024×1024）：
- cost = 800 × 1 = 800 token

### 余额不足处理

- 不执行 AI 调用，写入失败记录（status=failed）
- 抛出 402 状态码 + `insufficient_balance` 错误
- 前端弹出橙色提示 + 「前往充值」按钮

---

## 安全说明（演示版本）

- JWT 密钥硬编码（生产环境必须使用环境变量）
- OTP 不真发邮件/短信（沙箱直接返回）
- 不启用 HTTPS（生产环境必须启用）
- 不做请求频率限制（生产环境必须做）

---

## 部署

### 前端部署（妙搭）

项目已部署到妙搭，可通过应用链接直接访问。

### 后端部署（可选）

```bash
# 使用 uvicorn 生产模式
cd backend
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4

# 使用 gunicorn + uvicorn
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker -b 0.0.0.0:8000
```

### Docker 部署（示例）

```dockerfile
FROM python:3.10-slim
WORKDIR /app
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/ .
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

## 测试

后端 API 已在沙箱中实测，全部 200 OK：

```
=== 1. 模型列表          → 8 个模型
=== 2. 用户注册          → 200
=== 3. 获取用户信息      → 200
=== 4. 获取余额          → 200
=== 5. 文本对话(GPT-5.5) → 200, cost_tokens 真实计算
=== 6. 图像生成(即梦)    → 200, 返回 picsum 占位图
=== 7. 充值套餐列表      → 200
=== 8. 创建充值订单      → 200
=== 9. 模拟支付回调      → 200, 余额实时更新
=== 10. 消费记录         → 200
=== 11. 充值记录         → 200
=== 12. OTP 登录流程     → 申请 → 验证 → 登录 全跑通
=== 13. 余额不足场景     → 402 正确处理
```

---

## 目录说明

- `frontend/` - 纯前端，零依赖，任意静态 HTTP 服务可托管
- `backend/` - Python 3.10+ 依赖，仅 FastAPI/SQLAlchemy/PyJWT
- `screenshots/` - 31 张关键页面截图，含桌面端和移动端

---

## 许可

本项目为演示版本，仅供学习与产品演示使用。

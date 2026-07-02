#!/bin/bash
# 水库AI 一键启动脚本
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"
echo "🌊 启动水库AI..."
echo "   项目目录: $ROOT"

# 检查 python3
if ! command -v python3 &> /dev/null; then
  echo "❌ 未找到 python3，请先安装"
  exit 1
fi

# 后端
echo ""
echo "=== 启动后端 (端口 8000) ==="
cd "$ROOT/backend"

# 安装依赖（如未安装）
if ! python3 -c "import fastapi" 2>/dev/null; then
  echo "📦 安装后端依赖..."
  pip3 install --index-url https://pypi.org/simple/ -r requirements.txt 2>&1 | tail -3
fi

# 启动后端
nohup python3 main.py > "$ROOT/backend.log" 2>&1 &
BACKEND_PID=$!
echo "   后端 PID: $BACKEND_PID"
sleep 3

# 健康检查
if curl -s http://localhost:8000/api/health > /dev/null; then
  echo "   ✓ 后端启动成功: http://localhost:8000"
  echo "   ✓ API 文档: http://localhost:8000/docs"
else
  echo "   ❌ 后端启动失败，查看日志: $ROOT/backend.log"
  exit 1
fi

# 前端
echo ""
echo "=== 启动前端 (端口 8888) ==="
cd "$ROOT/frontend"
nohup python3 -m http.server 8888 > "$ROOT/frontend.log" 2>&1 &
FRONTEND_PID=$!
echo "   前端 PID: $FRONTEND_PID"
sleep 2

# 前端检查
if curl -s http://localhost:8888/index.html > /dev/null; then
  echo "   ✓ 前端启动成功: http://localhost:8888"
else
  echo "   ❌ 前端启动失败，查看日志: $ROOT/frontend.log"
  exit 1
fi

echo ""
echo "🌊 水库AI 启动完成！"
echo ""
echo "📱 前端访问: http://localhost:8888"
echo "🔧 后端 API: http://localhost:8000"
echo "📚 API 文档: http://localhost:8000/docs"
echo ""
echo "💡 演示账号："
echo "   - 邮箱: demo@reservoir.ai（注册时直接获取验证码）"
echo "   - 或任意邮箱/手机号 + 沙箱自动填入的 6 位码"
echo ""
echo "按 Ctrl+C 停止服务"
echo "或者: pkill -f 'python3 main.py'; pkill -f 'http.server 8888'"

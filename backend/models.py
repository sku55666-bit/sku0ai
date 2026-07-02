"""水库AI - 模型配置中心

定义了平台支持的全部 AI 模型，包括文本对话模型和图像生成模型。
不同模型有不同的 Token 单价（演示用，非真实价格）。

计费单位说明：
- 文本模型：input_price/output_price = token / 千 token（输入/输出）
- 图像模型：price_per_image = token / 张
"""

# 文本对话模型配置
# 演示价格：input/output 单价（token / 千 token）
# 设计目标：1000 token 的输入+输出大致消耗 15-30 token
TEXT_MODELS = [
    {
        "id": "gpt-5.5",
        "name": "GPT-5.5",
        "provider": "OpenAI",
        "category": "text",
        "logo_color": "#10A37F",
        "tags": ["旗舰", "通用", "推理"],
        "description": "OpenAI 最新旗舰模型，强大的通用推理与代码能力，复杂任务首选。",
        "input_price": 15,   # token / 千 token
        "output_price": 45,  # token / 千 token
        "context_window": 128000,
        "max_output": 8192,
    },
    {
        "id": "claude-opus-4",
        "name": "Claude Opus 4",
        "provider": "Anthropic",
        "category": "text",
        "logo_color": "#D97757",
        "tags": ["长文", "写作", "分析"],
        "description": "Anthropic 顶级模型，超长上下文，写作与分析能力卓越。",
        "input_price": 20,
        "output_price": 60,
        "context_window": 200000,
        "max_output": 8192,
    },
    {
        "id": "gemini-omni-pro",
        "name": "Gemini-Omni Pro",
        "provider": "Google",
        "category": "text",
        "logo_color": "#4285F4",
        "tags": ["多模态", "性价比", "快速"],
        "description": "Google 多模态模型，原生支持图文理解，性价比高。",
        "input_price": 8,
        "output_price": 24,
        "context_window": 1000000,
        "max_output": 8192,
    },
    {
        "id": "grok-3",
        "name": "Grok 3",
        "provider": "xAI",
        "category": "text",
        "logo_color": "#1DA1F2",
        "tags": ["实时", "幽默", "联网"],
        "description": "xAI 出品，实时联网信息，性格幽默风趣。",
        "input_price": 12,
        "output_price": 36,
        "context_window": 131072,
        "max_output": 8192,
    },
]

# 图像生成模型配置（演示：token / 张）
IMAGE_MODELS = [
    {
        "id": "jimeng-3",
        "name": "即梦 3.0",
        "provider": "字节跳动",
        "category": "image",
        "logo_color": "#5B5BFF",
        "tags": ["中文友好", "写实", "电商"],
        "description": "字节跳动出品的图像生成模型，中文提示词理解精准，电商场景表现优秀。",
        "price_per_image": 800,
        "resolutions": ["1024x1024", "1024x1536", "1536x1024"],
        "default_resolution": "1024x1024",
    },
    {
        "id": "kling-1.6",
        "name": "可灵 1.6",
        "provider": "快手",
        "category": "image",
        "logo_color": "#FF6633",
        "tags": ["国风", "人物", "高清"],
        "description": "快手可灵 1.6 图像模型，国风与人物表现突出，细节丰富。",
        "price_per_image": 900,
        "resolutions": ["1024x1024", "1024x1792", "1792x1024"],
        "default_resolution": "1024x1024",
    },
    {
        "id": "image-sdxl",
        "name": "Image SDXL",
        "provider": "Stability",
        "category": "image",
        "logo_color": "#9D34DA",
        "tags": ["开源", "风格化", "艺术"],
        "description": "Stable Diffusion XL，开源生态，风格化与艺术创作能力强大。",
        "price_per_image": 500,
        "resolutions": ["1024x1024", "1152x896", "896x1152"],
        "default_resolution": "1024x1024",
    },
    {
        "id": "banana-pro",
        "name": "Banana Pro",
        "provider": "Google DeepMind",
        "category": "image",
        "logo_color": "#F59E0B",
        "tags": ["轻量", "快速", "插画"],
        "description": "Google 出品的轻量级图像生成模型，速度快，适合插画与图标。",
        "price_per_image": 400,
        "resolutions": ["1024x1024", "1024x1024"],
        "default_resolution": "1024x1024",
    },
]

ALL_MODELS = TEXT_MODELS + IMAGE_MODELS
MODELS_BY_ID = {m["id"]: m for m in ALL_MODELS}


# 模拟 AI 回复模板（按模型生成不同风格）
TEXT_RESPONSE_TEMPLATES = {
    "gpt-5.5": [
        "好的，我帮你分析一下这个问题。\n\n从你描述的场景来看，这本质上是一个 **系统设计** 问题。我会从以下几个维度展开：\n\n1. **目标明确性**：先界定核心目标和边界条件\n2. **方案可执行性**：考虑资源约束和落地路径\n3. **风险与权衡**：识别潜在风险并给出应对建议\n\n如果可以，请补充更多上下文（比如团队规模、预算、deadline），我可以给出更具体的方案。",
        "这是一个很有意思的工程问题。让我用 GPT-5.5 的思路梳理一下：\n\n> 关键点：先抽象再具象，先验证再优化。\n\n我建议的解决路径：\n- 第一步：跑通最小可行版本（MVP）\n- 第二步：建立度量指标（北极星指标 + 辅助指标）\n- 第三步：基于数据做迭代\n\n需要我展开哪一步吗？",
    ],
    "claude-opus-4": [
        "感谢你的提问。我会从更长远的视角来回答这个问题。\n\n首先，让我们把问题放在更大的背景下看待：在一个快速变化的技术环境中，单纯追求短期最优解往往不是最佳选择。\n\n我的建议框架如下：\n\n- **第一性原理**：回到问题本质，不要被现有方案束缚\n- **长期价值**：评估 6 个月、12 个月后的影响\n- **可逆性**：优先选择那些可逆的决策\n\n具体到执行层面，我建议先花一周时间做充分的调研与对齐，再进入实施阶段。",
        "这是一个值得深思的问题。从写作的角度，我建议你考虑三个层面：\n\n1. **结构**：清晰的逻辑骨架比辞藻更重要\n2. **细节**：用具体案例替代抽象描述\n3. **节奏**：长短句交替，避免阅读疲劳\n\n希望这个思路对你有帮助。",
    ],
    "gemini-omni-pro": [
        "我来快速回应你的问题。\n\n核心结论：**采用分阶段实施的方案**。\n\n```\nPhase 1: 验证假设 (1-2周)\nPhase 2: 搭建最小版本 (2-4周)\nPhase 3: 推广与优化 (4-8周)\n```\n\nGemini-Omni 的优势在于我可以同时处理文本和图像，如果你需要，我可以帮你把上面这些信息转成一张流程图。",
        "好的，让我从多模态的角度给出一个综合回答。\n\n考虑到这是一个涉及多种输入类型的任务，我建议：\n\n- 使用统一的中间表示（Intermediate Representation）\n- 在边界处做严格的类型校验\n- 提供清晰的错误提示和降级路径\n\n需要我详细展开哪个部分？",
    ],
    "grok-3": [
        "哈哈，这个问题有意思 \n\n说实话，按照 Grok 的一贯风格，我会反问一句：你真的需要 AI 来回答这个问题吗？有时候答案就在你心里。\n\n不过既然你问了，我就正经回答一下：\n\n核心观点：**保持简单，但不要过于简化**。\n\n如果想听更详细的版本，告诉我就行。",
        "我直接说吧 —— 这种事没那么复杂。\n\n> 先干起来，再优化。\n\n完美是执行的敌人，先做出 60 分的版本，然后根据真实反馈迭代到 90 分。\n\n祝你顺利",
    ],
}


def get_model(model_id: str):
    """根据 model_id 获取模型配置"""
    return MODELS_BY_ID.get(model_id)


def list_text_models():
    return TEXT_MODELS


def list_image_models():
    return IMAGE_MODELS


def list_all_models():
    return ALL_MODELS


def estimate_text_tokens(text: str) -> int:
    """粗略估算 token 数（中文按 1.5 字符/token，英文按 0.75 词/token）"""
    if not text:
        return 0
    # 简化估算：每个中文字符 ~1 token, 每个英文单词 ~1.3 token
    chinese = sum(1 for c in text if '\u4e00' <= c <= '\u9fff')
    other = len(text) - chinese
    return max(1, int(chinese * 1.0 + other / 4))


def calculate_text_cost(model_id: str, input_tokens: int, output_tokens: int) -> int:
    """计算文本对话费用（token）"""
    m = get_model(model_id)
    if not m or m.get("category") != "text":
        return 0
    cost = (input_tokens * m["input_price"] + output_tokens * m["output_price"]) / 1000
    # 至少扣 1 token
    return max(1, int(cost + 0.5))

/* 水库AI - 客户端 API 模拟层
   完全模拟后端 FastAPI 行为，使用 localStorage 持久化。
   在妙搭部署环境下独立运行，所有数据持久化到浏览器。
*/

(function (global) {
  'use strict';

  const STORAGE_KEY = 'reservoir_ai_db';

  // ===== 模型配置（与后端一致） =====
  const TEXT_MODELS = [
    {
      id: 'gpt-5.5', name: 'GPT-5.5', provider: 'OpenAI', category: 'text',
      logo_color: '#10A37F',
      tags: ['旗舰', '通用', '推理'],
      description: 'OpenAI 最新旗舰模型，强大的通用推理与代码能力，复杂任务首选。',
      input_price: 15, output_price: 45, context_window: 128000, max_output: 8192,
    },
    {
      id: 'claude-opus-4', name: 'Claude Opus 4', provider: 'Anthropic', category: 'text',
      logo_color: '#D97757',
      tags: ['长文', '写作', '分析'],
      description: 'Anthropic 顶级模型，超长上下文，写作与分析能力卓越。',
      input_price: 20, output_price: 60, context_window: 200000, max_output: 8192,
    },
    {
      id: 'gemini-omni-pro', name: 'Gemini-Omni Pro', provider: 'Google', category: 'text',
      logo_color: '#4285F4',
      tags: ['多模态', '性价比', '快速'],
      description: 'Google 多模态模型，原生支持图文理解，性价比高。',
      input_price: 8, output_price: 24, context_window: 1000000, max_output: 8192,
    },
    {
      id: 'grok-3', name: 'Grok 3', provider: 'xAI', category: 'text',
      logo_color: '#1DA1F2',
      tags: ['实时', '幽默', '联网'],
      description: 'xAI 出品，实时联网信息，性格幽默风趣。',
      input_price: 12, output_price: 36, context_window: 131072, max_output: 8192,
    },
  ];

  const IMAGE_MODELS = [
    {
      id: 'jimeng-3', name: '即梦 3.0', provider: '字节跳动', category: 'image',
      logo_color: '#5B5BFF',
      tags: ['中文友好', '写实', '电商'],
      description: '字节跳动出品的图像生成模型，中文提示词理解精准，电商场景表现优秀。',
      price_per_image: 800,
      resolutions: ['1024x1024', '1024x1536', '1536x1024'],
      default_resolution: '1024x1024',
    },
    {
      id: 'kling-1.6', name: '可灵 1.6', provider: '快手', category: 'image',
      logo_color: '#FF6633',
      tags: ['国风', '人物', '高清'],
      description: '快手可灵 1.6 图像模型，国风与人物表现突出，细节丰富。',
      price_per_image: 900,
      resolutions: ['1024x1024', '1024x1792', '1792x1024'],
      default_resolution: '1024x1024',
    },
    {
      id: 'image-sdxl', name: 'Image SDXL', provider: 'Stability', category: 'image',
      logo_color: '#9D34DA',
      tags: ['开源', '风格化', '艺术'],
      description: 'Stable Diffusion XL，开源生态，风格化与艺术创作能力强大。',
      price_per_image: 500,
      resolutions: ['1024x1024', '1152x896', '896x1152'],
      default_resolution: '1024x1024',
    },
    {
      id: 'banana-pro', name: 'Banana Pro', provider: 'Google DeepMind', category: 'image',
      logo_color: '#F59E0B',
      tags: ['轻量', '快速', '插画'],
      description: 'Google 出品的轻量级图像生成模型，速度快，适合插画与图标。',
      price_per_image: 400,
      resolutions: ['1024x1024', '1024x1024'],
      default_resolution: '1024x1024',
    },
  ];

  const ALL_MODELS = [...TEXT_MODELS, ...IMAGE_MODELS];
  const MODELS_BY_ID = Object.fromEntries(ALL_MODELS.map(m => [m.id, m]));

  const TEXT_RESPONSES = {
    'gpt-5.5': [
      `好的，我帮你分析一下这个问题。\n\n从你描述的场景来看，这本质上是一个 **系统设计** 问题。我会从以下几个维度展开：\n\n1. **目标明确性**：先界定核心目标和边界条件\n2. **方案可执行性**：考虑资源约束和落地路径\n3. **风险与权衡**：识别潜在风险并给出应对建议\n\n如果可以，请补充更多上下文（比如团队规模、预算、deadline），我可以给出更具体的方案。`,
      `这是一个很有意思的工程问题。让我用 GPT-5.5 的思路梳理一下：\n\n> 关键点：先抽象再具象，先验证再优化。\n\n我建议的解决路径：\n- 第一步：跑通最小可行版本（MVP）\n- 第二步：建立度量指标（北极星指标 + 辅助指标）\n- 第三步：基于数据做迭代\n\n需要我展开哪一步吗？`,
    ],
    'claude-opus-4': [
      `感谢你的提问。我会从更长远的视角来回答这个问题。\n\n首先，让我们把问题放在更大的背景下看待：在一个快速变化的技术环境中，单纯追求短期最优解往往不是最佳选择。\n\n我的建议框架如下：\n\n- **第一性原理**：回到问题本质，不要被现有方案束缚\n- **长期价值**：评估 6 个月、12 个月后的影响\n- **可逆性**：优先选择那些可逆的决策\n\n具体到执行层面，我建议先花一周时间做充分的调研与对齐，再进入实施阶段。`,
      `这是一个值得深思的问题。从写作的角度，我建议你考虑三个层面：\n\n1. **结构**：清晰的逻辑骨架比辞藻更重要\n2. **细节**：用具体案例替代抽象描述\n3. **节奏**：长短句交替，避免阅读疲劳\n\n希望这个思路对你有帮助。`,
    ],
    'gemini-omni-pro': [
      `我来快速回应你的问题。\n\n核心结论：**采用分阶段实施的方案**。\n\n\`\`\`\nPhase 1: 验证假设 (1-2周)\nPhase 2: 搭建最小版本 (2-4周)\nPhase 3: 推广与优化 (4-8周)\n\`\`\`\n\nGemini-Omni 的优势在于我可以同时处理文本和图像，如果你需要，我可以帮你把上面这些信息转成一张流程图。`,
    ],
    'grok-3': [
      `哈哈，这个问题有意思\n\n说实话，按照 Grok 的一贯风格，我会反问一句：你真的需要 AI 来回答这个问题吗？有时候答案就在你心里。\n\n不过既然你问了，我就正经回答一下：\n\n核心观点：**保持简单，但不要过于简化**。\n\n如果想听更详细的版本，告诉我就行。`,
      `我直接说吧 —— 这种事没那么复杂。\n\n> 先干起来，再优化。\n\n完美是执行的敌人，先做出 60 分的版本，然后根据真实反馈迭代到 90 分。\n\n祝你顺利`,
    ],
  };

  // ===== 充值套餐 =====
  const RECHARGE_PACKAGES = [
    { name: '入门版', amount_cny: 10, token_amount: 10000, tag: '体验首选' },
    { name: '标准版', amount_cny: 50, token_amount: 55000, tag: '人气推荐', highlight: true },
    { name: '专业版', amount_cny: 200, token_amount: 240000, tag: '高性价比' },
    { name: '企业版', amount_cny: 1000, token_amount: 1300000, tag: '团队首选' },
  ];
  const CUSTOM_RATE = 1000;

  // ===== 数据层 =====
  function loadDB() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultDB();
      return JSON.parse(raw);
    } catch (e) {
      return defaultDB();
    }
  }

  function saveDB(db) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  }

  function defaultDB() {
    return {
      users: [],         // {id, identifier, identifier_type, nickname, balance, total_spent, total_calls, created_at, last_login}
      currentUserId: null,
      otps: [],          // {id, identifier, code, purpose, used, created_at, expires_at}
      orders: [],        // {id, order_no, user_id, amount_cny, token_amount, package_name, status, payment_method, created_at, paid_at}
      usages: [],        // {id, user_id, model_id, model_name, call_type, input_tokens, output_tokens, total_tokens, cost_tokens, prompt_preview, result_preview, image_url, status, created_at}
      session: {         // 会话状态（无 JWT，用 session 代替）
        token: null,
        createdAt: null,
      },
      counters: { user: 0, otp: 0, order: 0, usage: 0 },
    };
  }

  function nextId(db, kind) {
    db.counters[kind] = (db.counters[kind] || 0) + 1;
    return db.counters[kind];
  }

  function nowISO() { return new Date().toISOString(); }

  function findUser(db, identifier) {
    return db.users.find(u => u.identifier === identifier);
  }

  function genOTP() {
    return String(Math.floor(Math.random() * 1000000)).padStart(6, '0');
  }

  function genOrderNo() {
    const ts = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);
    const rand = Math.random().toString(16).slice(2, 10).toUpperCase();
    return `RC${ts}${rand}`;
  }

  function estimateTokens(text) {
    if (!text) return 0;
    const chinese = [...text].filter(c => c >= '\u4e00' && c <= '\u9fff').length;
    const other = text.length - chinese;
    return Math.max(1, Math.floor(chinese * 1.0 + other / 4));
  }

  // ===== API 实现 =====
  const api = {
    // ----- 健康检查 -----
    health: async function () {
      return { status: 'ok', service: '水库AI API', version: '1.0.0-demo (client)' };
    },

    // ----- 模型 -----
    listModels: async function (category) {
      if (category === 'text') return { models: TEXT_MODELS };
      if (category === 'image') return { models: IMAGE_MODELS };
      return { models: ALL_MODELS };
    },

    // ----- 认证 -----
    register: async function ({ identifier, identifier_type }) {
      const db = loadDB();
      if (findUser(db, identifier)) {
        throw new Error('该邮箱/手机号已注册');
      }
      const id = nextId(db, 'user');
      const user = {
        id,
        identifier,
        identifier_type,
        nickname: identifier.includes('@') ? identifier.split('@')[0] : `用户${identifier.slice(-4)}`,
        balance: 5000,
        total_spent: 0,
        total_calls: 0,
        created_at: nowISO(),
        last_login: nowISO(),
      };
      db.users.push(user);
      db.currentUserId = id;
      db.session.token = 'session_' + id + '_' + Date.now();
      db.session.createdAt = nowISO();
      saveDB(db);
      return {
        message: '注册成功',
        access_token: db.session.token,
        token_type: 'bearer',
        user,
      };
    },

    requestOtp: async function ({ identifier, identifier_type, purpose = 'login' }) {
      const db = loadDB();
      const user = findUser(db, identifier);
      if (purpose === 'login' && !user) {
        throw new Error('该账户未注册，请先注册');
      }
      if (purpose === 'register' && user) {
        throw new Error('该账户已注册，请直接登录');
      }
      const code = genOTP();
      const expires = new Date(Date.now() + 5 * 60 * 1000).toISOString();
      db.otps.push({
        id: nextId(db, 'otp'),
        identifier, code, purpose, used: false,
        created_at: nowISO(), expires_at: expires,
      });
      // 演示：自动 fill（同一浏览器一码通用）
      // 保留最近 5 条
      if (db.otps.length > 50) db.otps = db.otps.slice(-50);
      saveDB(db);
      return {
        message: '验证码已发送（演示：沙箱直接返回）',
        demo_code: code,
        expires_in: 300,
        identifier,
      };
    },

    verifyOtp: async function ({ identifier, code, purpose = 'login' }) {
      const db = loadDB();
      // 取最新未使用 OTP
      const otps = db.otps
        .filter(o => o.identifier === identifier && o.purpose === purpose && !o.used)
        .sort((a, b) => b.created_at.localeCompare(a.created_at));
      const otp = otps[0];
      if (!otp) throw new Error('请先获取验证码');
      if (new Date(otp.expires_at) < new Date()) throw new Error('验证码已过期，请重新获取');
      if (otp.code !== code) throw new Error('验证码不正确');
      otp.used = true;

      const user = findUser(db, identifier);
      if (!user) throw new Error('用户不存在，请先注册');
      user.last_login = nowISO();
      db.currentUserId = user.id;
      db.session.token = 'session_' + user.id + '_' + Date.now();
      db.session.createdAt = nowISO();
      saveDB(db);
      return {
        message: '登录成功',
        access_token: db.session.token,
        token_type: 'bearer',
        user,
      };
    },

    logout: async function () {
      const db = loadDB();
      db.currentUserId = null;
      db.session.token = null;
      saveDB(db);
      return { message: '已登出' };
    },

    // ----- 用户 -----
    getCurrentUser: async function () {
      const db = loadDB();
      if (!db.currentUserId) throw new Error('请先登录');
      const user = db.users.find(u => u.id === db.currentUserId);
      if (!user) throw new Error('用户不存在');
      return { user };
    },

    getBalance: async function () {
      const db = loadDB();
      if (!db.currentUserId) throw new Error('请先登录');
      const user = db.users.find(u => u.id === db.currentUserId);
      return {
        balance: user.balance,
        total_spent: user.total_spent,
        total_calls: user.total_calls,
      };
    },

    updateNickname: async function (nickname) {
      const db = loadDB();
      if (!db.currentUserId) throw new Error('请先登录');
      const user = db.users.find(u => u.id === db.currentUserId);
      user.nickname = nickname;
      saveDB(db);
      return { user };
    },

    // ----- 充值 -----
    getRechargePackages: async function () {
      return { packages: RECHARGE_PACKAGES, custom_rate: CUSTOM_RATE };
    },

    createRecharge: async function ({ amount_cny, package_name }) {
      const db = loadDB();
      if (!db.currentUserId) throw new Error('请先登录');
      let token_amount, matched = null;
      for (const pkg of RECHARGE_PACKAGES) {
        if (package_name === pkg.name || amount_cny === pkg.amount_cny) {
          matched = pkg;
          break;
        }
      }
      if (matched) {
        token_amount = matched.token_amount;
        package_name = matched.name;
      } else {
        token_amount = Math.floor(amount_cny * CUSTOM_RATE);
        package_name = '自定义';
      }
      const order = {
        id: nextId(db, 'order'),
        order_no: genOrderNo(),
        user_id: db.currentUserId,
        amount_cny,
        token_amount,
        package_name,
        status: 'pending',
        payment_method: 'alipay',
        created_at: nowISO(),
        paid_at: null,
      };
      db.orders.push(order);
      saveDB(db);
      return {
        order_no: order.order_no,
        amount_cny: order.amount_cny,
        token_amount: order.token_amount,
        package_name: order.package_name,
        status: order.status,
        payment_url: `/api/recharge/pay/${order.order_no}`,
      };
    },

    verifyRecharge: async function ({ order_no }) {
      const db = loadDB();
      if (!db.currentUserId) throw new Error('请先登录');
      const order = db.orders.find(o => o.order_no === order_no && o.user_id === db.currentUserId);
      if (!order) throw new Error('订单不存在');
      if (order.status === 'paid') {
        return { message: '订单已支付', order_no: order.order_no, status: 'paid' };
      }
      // 演示：直接到账
      order.status = 'paid';
      order.paid_at = nowISO();
      const user = db.users.find(u => u.id === db.currentUserId);
      user.balance += order.token_amount;
      saveDB(db);
      return {
        message: '支付成功',
        order_no: order.order_no,
        amount_cny: order.amount_cny,
        token_amount: order.token_amount,
        balance_after: user.balance,
      };
    },

    // ----- AI 调用 -----
    chatCompletions: async function ({ model, messages }) {
      const db = loadDB();
      if (!db.currentUserId) throw new Error('请先登录');
      const m = MODELS_BY_ID[model];
      if (!m) throw new Error('模型不存在');
      if (m.category !== 'text') throw new Error('该模型不支持文本对话');

      const inputText = messages.map(x => x.content).join('\n');
      const inputTokens = estimateTokens(inputText);
      const templates = TEXT_RESPONSES[model] || ['演示版本：这是一个 AI 模拟回复。'];
      const reply = templates[Math.floor(Math.random() * templates.length)];
      const outputTokens = estimateTokens(reply);

      // 模拟网络延迟
      await new Promise(r => setTimeout(r, 600 + Math.random() * 800));

      const costTokens = Math.max(1, Math.floor((inputTokens * m.input_price + outputTokens * m.output_price) / 1000));

      const user = db.users.find(u => u.id === db.currentUserId);
      if (user.balance < costTokens) {
        // 写一条失败记录
        db.usages.push({
          id: nextId(db, 'usage'),
          user_id: user.id,
          model_id: model, model_name: m.name,
          call_type: 'text',
          input_tokens: inputTokens, output_tokens: outputTokens, total_tokens: inputTokens + outputTokens,
          cost_tokens: costTokens,
          prompt_preview: inputText.slice(0, 200),
          result_preview: '[余额不足，调用未执行]',
          image_url: null,
          status: 'failed',
          created_at: nowISO(),
        });
        saveDB(db);
        const err = new Error(`余额不足，需要 ${costTokens} token，当前余额 ${user.balance}`);
        err.code = 'INSUFFICIENT_BALANCE';
        err.required = costTokens;
        err.current = user.balance;
        throw err;
      }

      user.balance -= costTokens;
      user.total_spent += costTokens;
      user.total_calls += 1;

      db.usages.push({
        id: nextId(db, 'usage'),
        user_id: user.id,
        model_id: model, model_name: m.name,
        call_type: 'text',
        input_tokens: inputTokens, output_tokens: outputTokens, total_tokens: inputTokens + outputTokens,
        cost_tokens: costTokens,
        prompt_preview: inputText.slice(0, 200),
        result_preview: reply.slice(0, 500),
        image_url: null,
        status: 'success',
        created_at: nowISO(),
      });
      saveDB(db);

      return {
        model, reply,
        usage: {
          input_tokens: inputTokens,
          output_tokens: outputTokens,
          total_tokens: inputTokens + outputTokens,
          cost_tokens: costTokens,
        },
        balance_after: user.balance,
      };
    },

    imageGenerations: async function ({ model, prompt, n = 1 }) {
      const db = loadDB();
      if (!db.currentUserId) throw new Error('请先登录');
      const m = MODELS_BY_ID[model];
      if (!m) throw new Error('模型不存在');
      if (m.category !== 'image') throw new Error('该模型不支持图像生成');
      if (!prompt || prompt.trim().length < 2) throw new Error('请输入有效的提示词');

      // 模拟网络延迟（图像生成较慢）
      await new Promise(r => setTimeout(r, 1200 + Math.random() * 1500));

      n = Math.max(1, Math.min(n, 4));
      const costTokens = m.price_per_image * n;

      const user = db.users.find(u => u.id === db.currentUserId);
      if (user.balance < costTokens) {
        db.usages.push({
          id: nextId(db, 'usage'),
          user_id: user.id,
          model_id: model, model_name: m.name,
          call_type: 'image',
          input_tokens: 0, output_tokens: n, total_tokens: n,
          cost_tokens: costTokens,
          prompt_preview: prompt.slice(0, 200),
          result_preview: '[余额不足，调用未执行]',
          image_url: null,
          status: 'failed',
          created_at: nowISO(),
        });
        saveDB(db);
        const err = new Error(`余额不足，需要 ${costTokens} token，当前余额 ${user.balance}`);
        err.code = 'INSUFFICIENT_BALANCE';
        err.required = costTokens;
        err.current = user.balance;
        throw err;
      }

      user.balance -= costTokens;
      user.total_spent += costTokens;
      user.total_calls += n;

      // 基于 prompt 生成稳定 seed
      let seed = 0;
      for (let i = 0; i < prompt.length; i++) {
        seed = (seed * 31 + prompt.charCodeAt(i)) & 0x7fffffff;
      }
      const images = [];
      for (let i = 0; i < n; i++) {
        images.push({
          url: `https://picsum.photos/seed/${seed + i}/1024/1024`,
          width: 1024, height: 1024,
        });
      }

      db.usages.push({
        id: nextId(db, 'usage'),
        user_id: user.id,
        model_id: model, model_name: m.name,
        call_type: 'image',
        input_tokens: 0, output_tokens: n, total_tokens: n,
        cost_tokens: costTokens,
        prompt_preview: prompt.slice(0, 200),
        result_preview: `生成 ${n} 张图像`,
        image_url: images[0].url,
        status: 'success',
        created_at: nowISO(),
      });
      saveDB(db);

      return {
        model, prompt, resolution: '1024x1024', n,
        images,
        usage: { total_tokens: n, cost_tokens: costTokens },
        balance_after: user.balance,
      };
    },

    // ----- 记录 -----
    usageRecords: async function ({ page = 1, page_size = 20 } = {}) {
      const db = loadDB();
      if (!db.currentUserId) throw new Error('请先登录');
      const list = db.usages
        .filter(u => u.user_id === db.currentUserId)
        .sort((a, b) => b.created_at.localeCompare(a.created_at));
      const start = (page - 1) * page_size;
      return {
        total: list.length,
        page, page_size,
        records: list.slice(start, start + page_size),
      };
    },

    rechargeRecords: async function ({ page = 1, page_size = 20 } = {}) {
      const db = loadDB();
      if (!db.currentUserId) throw new Error('请先登录');
      const list = db.orders
        .filter(o => o.user_id === db.currentUserId)
        .sort((a, b) => b.created_at.localeCompare(a.created_at));
      const start = (page - 1) * page_size;
      return {
        total: list.length,
        page, page_size,
        records: list.slice(start, start + page_size),
      };
    },

    // ----- 工具 -----
    isLoggedIn: function () {
      const db = loadDB();
      return !!db.currentUserId;
    },

    resetDemo: function () {
      localStorage.removeItem(STORAGE_KEY);
    },
  };

  global.ReservoirAPI = api;
  global.ReservoirConfig = {
    TEXT_MODELS, IMAGE_MODELS, ALL_MODELS, MODELS_BY_ID,
    RECHARGE_PACKAGES, CUSTOM_RATE,
  };
})(window);

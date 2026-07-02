/* 水库AI - AI 对话/生成页（核心功能页） */
(function () {
  'use strict';
  const { ReservoirConfig, ReservoirAPI } = window;
  const { TEXT_MODELS, IMAGE_MODELS, ALL_MODELS, MODELS_BY_ID } = ReservoirConfig;
  const { escapeHTML, modelAvatar, formatNumber, renderMarkdown, navigate, showToast, animateNumber } = window.ReservoirUI;

  // 状态
  let state = {
    mode: 'text',           // 'text' / 'image'
    selectedTextModel: 'gpt-5.5',
    selectedImageModel: 'jimeng-3',
    messages: [],           // 文本对话消息
    imagePrompt: '',        // 图像提示词
    imageResult: null,      // 图像结果
    imageResults: [],       // 多次生成结果
    imageCount: 1,
    loading: false,
    balance: 0,
  };

  async function refreshBalance() {
    try {
      const r = await ReservoirAPI.getBalance();
      state.balance = r.balance;
      updateBalanceDisplay();
    } catch (e) {
      // ignore
    }
  }

  function updateBalanceDisplay(animate = false) {
    const el = document.getElementById('chat-balance-value');
    if (!el) return;
    if (animate) {
      const oldValue = parseInt(el.dataset.value || '0', 10);
      animateNumber(el, oldValue, state.balance, 600);
    } else {
      el.textContent = formatNumber(state.balance);
    }
    el.dataset.value = state.balance;

    // 同步更新顶部 header 的余额
    const headerEl = document.getElementById('header-balance-value');
    if (headerEl) {
      headerEl.textContent = formatNumber(state.balance);
    }
  }

  function renderModelList() {
    const models = state.mode === 'text' ? TEXT_MODELS : IMAGE_MODELS;
    const selectedId = state.mode === 'text' ? state.selectedTextModel : state.selectedImageModel;
    return `
      <div class="model-list">
        <div class="model-list-title">${state.mode === 'text' ? '文本对话模型' : '图像生成模型'}</div>
        ${models.map(m => `
          <div class="model-list-item ${m.id === selectedId ? 'active' : ''}" data-model-id="${m.id}">
            ${modelAvatar(m)}
            <div style="flex:1;min-width:0;">
              <div class="model-list-name">${escapeHTML(m.name)}</div>
              <div class="model-list-meta">${escapeHTML(m.provider)}</div>
            </div>
            <div class="model-list-price mono">
              ${m.category === 'image'
                ? formatNumber(m.price_per_image)
                : `${m.input_price}/${m.output_price}`}
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  function renderHeader() {
    const selectedId = state.mode === 'text' ? state.selectedTextModel : state.selectedImageModel;
    const m = MODELS_BY_ID[selectedId];
    return `
      <div class="chat-header">
        <div class="flex items-center gap-3" style="flex:1;min-width:0;">
          ${modelAvatar(m)}
          <div style="min-width:0;">
            <div class="h3" style="font-size:16px;line-height:1.2;">${escapeHTML(m.name)}</div>
            <div class="text-muted" style="font-size:12px;">${escapeHTML(m.provider)}</div>
          </div>
        </div>
        <div class="balance-display">
          <div class="text-muted" style="font-size:11px;">Token 余额</div>
          <div id="chat-balance-value" class="mono text-accent" style="font-size:18px;font-weight:700;">${formatNumber(state.balance)}</div>
        </div>
        <button class="btn btn-primary" data-action="recharge">充值</button>
      </div>
    `;
  }

  function renderTextMode() {
    if (state.messages.length === 0) {
      return `
        <div class="empty-state">
          <div class="empty-icon">💬</div>
          <h3 class="h3 mb-2">开始与 AI 对话</h3>
          <p class="text-secondary mb-6">${escapeHTML(MODELS_BY_ID[state.selectedTextModel].description)}</p>
          <div class="empty-suggestions">
            <div class="suggestion-chip" data-prompt="请帮我写一段产品介绍文案，目标用户是 AI 开发者，200字左右">写一段产品介绍文案</div>
            <div class="suggestion-chip" data-prompt="请用 Python 写一个快速排序的递归实现，并附详细注释">Python 快速排序实现</div>
            <div class="suggestion-chip" data-prompt="我是一名独立开发者，想做一个 AI 聚合平台，请你帮我设计 MVP 方案">AI 聚合平台 MVP 方案</div>
            <div class="suggestion-chip" data-prompt="请帮我梳理一下微服务架构的优缺点，给出选型建议">微服务架构选型</div>
          </div>
        </div>
      `;
    }

    return `
      <div class="chat-messages">
        ${state.messages.map(msg => `
          <div class="message message-${msg.role}">
            <div class="message-avatar">${msg.role === 'user' ? '我' : 'AI'}</div>
            <div class="message-bubble ${msg.role === 'assistant' ? 'markdown' : ''}">
              ${msg.role === 'assistant' ? renderMarkdown(msg.content) : escapeHTML(msg.content)}
              ${msg.usage ? `
                <div class="message-meta">
                  <span class="mono">消耗 ${formatNumber(msg.usage.cost_tokens)} token</span>
                  <span>·</span>
                  <span class="mono">剩余 ${formatNumber(msg.usage.balance_after)}</span>
                </div>
              ` : ''}
            </div>
          </div>
        `).join('')}
        ${state.loading ? `
          <div class="message message-assistant">
            <div class="message-avatar">AI</div>
            <div class="message-bubble loading-bubble">
              <div class="loading-dots">
                <span></span><span></span><span></span>
              </div>
              <span class="text-secondary" style="font-size:14px;margin-left:8px;">AI 正在生成...</span>
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }

  function renderImageMode() {
    if (state.imageResults.length === 0) {
      return `
        <div class="empty-state">
          <div class="empty-icon">🎨</div>
          <h3 class="h3 mb-2">输入提示词生成图像</h3>
          <p class="text-secondary mb-6">${escapeHTML(MODELS_BY_ID[state.selectedImageModel].description)}</p>
          <div class="empty-suggestions">
            <div class="suggestion-chip" data-image-prompt="a cute cat playing with yarn ball, oil painting style">可爱的猫咪玩毛线球</div>
            <div class="suggestion-chip" data-image-prompt="futuristic city skyline at night, neon lights, cyberpunk">赛博朋克夜景城市</div>
            <div class="suggestion-chip" data-image-prompt="an astronaut floating in space, surrounded by galaxies, digital art">太空中的宇航员</div>
          </div>
        </div>
      `;
    }

    return `
      <div class="image-results">
        ${state.imageResults.map((r, i) => `
          <div class="image-result-item">
            <div class="image-result-header">
              <div class="flex-1">
                <div class="text-muted" style="font-size:12px;">#${i + 1} · ${escapeHTML(MODELS_BY_ID[r.model].name)}</div>
                <div class="text-secondary mt-2" style="font-size:14px;">${escapeHTML(r.prompt)}</div>
              </div>
            </div>
            <div class="image-grid" style="grid-template-columns:repeat(${r.images.length}, 1fr);">
              ${r.images.map(img => `
                <div class="image-card">
                  <img src="${img.url}" alt="generated" loading="lazy" />
                  <div class="image-overlay">
                    <button class="btn btn-ghost" data-action="copy-image" data-url="${img.url}">复制链接</button>
                  </div>
                </div>
              `).join('')}
            </div>
            <div class="message-meta mt-2">
              <span class="mono">消耗 ${formatNumber(r.usage.cost_tokens)} token</span>
              <span>·</span>
              <span class="mono">剩余 ${formatNumber(r.usage.balance_after)}</span>
              <span>·</span>
              <span>${new Date(r.createdAt).toLocaleString('zh-CN')}</span>
            </div>
          </div>
        `).join('')}
        ${state.loading ? `
          <div class="image-result-item">
            <div class="loading-bubble" style="min-height:200px;display:flex;align-items:center;justify-content:center;">
              <div class="loading-dots"><span></span><span></span><span></span></div>
              <span class="text-secondary" style="margin-left:12px;">正在生成图像...</span>
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }

  function renderInputArea() {
    if (state.mode === 'text') {
      return `
        <div class="input-area">
          <div class="input-toolbar">
            <span class="text-muted" style="font-size:12px;">Enter 发送 · Shift+Enter 换行</span>
            <button class="btn btn-ghost" data-action="clear-chat" style="padding:4px 10px;font-size:12px;">清空对话</button>
          </div>
          <div class="input-box">
            <textarea id="chat-input" class="form-textarea" rows="3" placeholder="输入你的问题或指令..." style="min-height:60px;background:transparent;border:none;padding:0;"></textarea>
            <button class="btn btn-primary" data-action="send-text" ${state.loading ? 'disabled' : ''}>
              ${state.loading ? '生成中...' : '发送'}
            </button>
          </div>
        </div>
      `;
    } else {
      const m = MODELS_BY_ID[state.selectedImageModel];
      return `
        <div class="input-area">
          <div class="image-input-row">
            <textarea id="image-prompt" class="form-textarea" rows="2" placeholder="描述你想要生成的图像，例如：一只可爱的猫咪玩毛线球，油画风格">${escapeHTML(state.imagePrompt)}</textarea>
          </div>
          <div class="image-input-actions">
            <div class="flex items-center gap-2">
              <span class="text-muted" style="font-size:13px;">生成数量:</span>
              <select class="form-select" id="image-count-select" style="width:auto;padding:6px 12px;">
                <option value="1" ${state.imageCount === 1 ? 'selected' : ''}>1 张</option>
                <option value="2" ${state.imageCount === 2 ? 'selected' : ''}>2 张</option>
                <option value="3" ${state.imageCount === 3 ? 'selected' : ''}>3 张</option>
                <option value="4" ${state.imageCount === 4 ? 'selected' : ''}>4 张</option>
              </select>
              <span class="text-muted" style="font-size:12px;">预计消耗 ${formatNumber(m.price_per_image * state.imageCount)} token</span>
            </div>
            <button class="btn btn-primary" data-action="send-image" ${state.loading ? 'disabled' : ''}>
              ${state.loading ? '生成中...' : '生成图像'}
            </button>
          </div>
        </div>
      `;
    }
  }

  function render() {
    if (!ReservoirAPI.isLoggedIn()) {
      navigate('auth', { mode: 'login' });
      return;
    }
    const root = document.getElementById('page-chat');
    root.innerHTML = `
      <div class="chat-page">
        <div class="chat-sidebar">
          <div class="form-tabs" style="margin-bottom:16px;">
            <div class="form-tab ${state.mode === 'text' ? 'active' : ''}" data-mode="text">💬 文本</div>
            <div class="form-tab ${state.mode === 'image' ? 'active' : ''}" data-mode="image">🎨 图像</div>
          </div>
          ${renderModelList()}
        </div>
        <div class="chat-main">
          ${renderHeader()}
          <div class="chat-content" id="chat-content">
            ${state.mode === 'text' ? renderTextMode() : renderImageMode()}
          </div>
          ${renderInputArea()}
        </div>
      </div>
    `;

    bindEvents();
    // 滚动到底部
    setTimeout(() => {
      const c = document.getElementById('chat-content');
      if (c) c.scrollTop = c.scrollHeight;
    }, 50);
  }

  function bindEvents() {
    const root = document.getElementById('page-chat');

    // 模式切换
    root.querySelectorAll('[data-mode]').forEach(el => {
      el.addEventListener('click', () => {
        state.mode = el.dataset.mode;
        render();
      });
    });

    // 模型选择
    root.querySelectorAll('.model-list-item').forEach(el => {
      el.addEventListener('click', () => {
        if (state.mode === 'text') {
          state.selectedTextModel = el.dataset.modelId;
        } else {
          state.selectedImageModel = el.dataset.modelId;
        }
        render();
      });
    });

    // 事件委托
    root.addEventListener('click', async (e) => {
      const target = e.target.closest('[data-action]');
      if (!target) return;
      const action = target.dataset.action;

      if (action === 'send-text') {
        await sendText();
      } else if (action === 'send-image') {
        await sendImage();
      } else if (action === 'clear-chat') {
        state.messages = [];
        render();
      } else if (action === 'recharge') {
        navigate('recharge');
      } else if (action === 'copy-image') {
        const url = target.dataset.url;
        try {
          await navigator.clipboard.writeText(url);
          showToast('图片链接已复制', 'success');
        } catch (err) {
          showToast('复制失败', 'error');
        }
      }
    });

    // 文本输入 enter
    const chatInput = document.getElementById('chat-input');
    if (chatInput) {
      chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          sendText();
        }
      });
      chatInput.addEventListener('input', (e) => {
        state.imagePrompt = '';  // 防止污染
      });
    }

    // 图像 prompt 输入
    const imgInput = document.getElementById('image-prompt');
    if (imgInput) {
      imgInput.addEventListener('input', (e) => {
        state.imagePrompt = e.target.value;
      });
    }

    // 数量选择
    const countSelect = document.getElementById('image-count-select');
    if (countSelect) {
      countSelect.addEventListener('change', (e) => {
        state.imageCount = parseInt(e.target.value, 10);
        render();
      });
    }

    // 建议 prompt
    root.querySelectorAll('.suggestion-chip').forEach(el => {
      el.addEventListener('click', () => {
        if (state.mode === 'text') {
          const input = document.getElementById('chat-input');
          if (input) {
            input.value = el.dataset.prompt;
            input.focus();
          }
        } else {
          state.imagePrompt = el.dataset.imagePrompt;
          render();
        }
      });
    });
  }

  async function sendText() {
    const input = document.getElementById('chat-input');
    if (!input || state.loading) return;
    const text = input.value.trim();
    if (!text) {
      showToast('请输入内容', 'warning');
      return;
    }
    state.loading = true;
    state.messages.push({ role: 'user', content: text });
    input.value = '';
    render();

    try {
      const r = await ReservoirAPI.chatCompletions({
        model: state.selectedTextModel,
        messages: state.messages.map(m => ({ role: m.role, content: m.content })),
      });
      state.messages.push({
        role: 'assistant',
        content: r.reply,
        usage: r.usage,
      });
      state.loading = false;
      // 用数字动画更新余额
      const oldBal = state.balance;
      state.balance = r.balance_after;
      render();
      setTimeout(() => {
        const el = document.getElementById('chat-balance-value');
        if (el) animateNumber(el, oldBal, state.balance, 600);
        const headerEl = document.getElementById('header-balance-value');
        if (headerEl) animateNumber(headerEl, oldBal, state.balance, 600);
      }, 50);
    } catch (e) {
      state.loading = false;
      render();
      if (e.code === 'INSUFFICIENT_BALANCE') {
        showToast(`余额不足，需要 ${e.required} token，请充值`, 'warning', 3500);
        // 显示充值提示
        await window.ReservoirUI.showModal({
          title: '余额不足',
          desc: `本次调用需要 <strong style="color:var(--color-warning)">${e.required}</strong> token，当前余额 <strong style="color:var(--color-warning)">${e.current}</strong> token。请充值后继续使用。`,
          confirmText: '前往充值',
          cancelText: '取消',
          onConfirm: () => navigate('recharge'),
        });
      } else {
        showToast('调用失败：' + e.message, 'error', 3000);
      }
    }
  }

  async function sendImage() {
    const input = document.getElementById('image-prompt');
    if (!input || state.loading) return;
    const prompt = input.value.trim();
    if (!prompt) {
      showToast('请输入提示词', 'warning');
      return;
    }
    state.loading = true;
    render();

    try {
      const r = await ReservoirAPI.imageGenerations({
        model: state.selectedImageModel,
        prompt,
        n: state.imageCount,
      });
      state.imageResults.unshift({
        ...r,
        createdAt: new Date().toISOString(),
      });
      state.loading = false;
      const oldBal = state.balance;
      state.balance = r.balance_after;
      render();
      setTimeout(() => {
        const el = document.getElementById('chat-balance-value');
        if (el) animateNumber(el, oldBal, state.balance, 600);
        const headerEl = document.getElementById('header-balance-value');
        if (headerEl) animateNumber(headerEl, oldBal, state.balance, 600);
      }, 50);
      showToast('图像生成成功', 'success');
    } catch (e) {
      state.loading = false;
      render();
      if (e.code === 'INSUFFICIENT_BALANCE') {
        showToast(`余额不足，需要 ${e.required} token，请充值`, 'warning', 3500);
        await window.ReservoirUI.showModal({
          title: '余额不足',
          desc: `本次生成需要 <strong style="color:var(--color-warning)">${e.required}</strong> token，当前余额 <strong style="color:var(--color-warning)">${e.current}</strong> token。请充值后继续使用。`,
          confirmText: '前往充值',
          cancelText: '取消',
          onConfirm: () => navigate('recharge'),
        });
      } else {
        showToast('生成失败：' + e.message, 'error', 3000);
      }
    }
  }

  async function onEnter(params = {}) {
    if (params.model) {
      const m = MODELS_BY_ID[params.model];
      if (m) {
        if (m.category === 'text') state.selectedTextModel = params.model;
        else {
          state.selectedImageModel = params.model;
          state.mode = 'image';
        }
      }
    }
    if (params.mode === 'image') state.mode = 'image';
    await refreshBalance();
    render();
  }

  function onLeave() {
    // 清空 input 状态防止污染
    state.imagePrompt = '';
  }

  window.ChatPage = { onEnter, onLeave };
})();

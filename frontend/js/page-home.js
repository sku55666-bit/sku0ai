/* 水库AI - 首页 */
(function () {
  'use strict';
  const { ReservoirConfig, ReservoirAPI } = window;
  const { ALL_MODELS } = ReservoirConfig;
  const { escapeHTML, modelAvatar, formatNumber, navigate } = window.ReservoirUI;

  function renderHero() {
    return `
      <section class="hero" style="position:relative;padding:80px 0 64px;overflow:hidden;">
        <div class="particle-bg">
          ${Array.from({ length: 24 }).map((_, i) => `
            <div class="particle" style="
              top:${Math.random() * 100}%;
              left:${Math.random() * 100}%;
              animation-delay:${Math.random() * 12}s;
              animation-duration:${8 + Math.random() * 8}s;
            "></div>
          `).join('')}
        </div>

        <div class="container" style="position:relative;z-index:1;text-align:center;">
          <div class="badge mb-4" style="display:inline-flex;align-items:center;gap:6px;">
            <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--color-success);box-shadow:0 0 8px var(--color-success);"></span>
            演示版本 · 全部 AI 调用均为模拟
          </div>
          <h1 class="h1 mb-4">
            <span class="gradient-text">全球AI大模型</span><br>
            <span class="gradient-text-accent">一站调用</span>
          </h1>
          <p class="text-secondary mb-8" style="font-size:18px;max-width:680px;margin-left:auto;margin-right:auto;line-height:1.7;">
            聚合 GPT-5.5、Claude、Gemini-Omni、Grok、即梦、可灵等主流 AI 模型，<br>
            Token 计费 · 随用随充 · 统一管理
          </p>
          <div class="flex gap-3" style="justify-content:center;flex-wrap:wrap;">
            <button class="btn btn-primary btn-large" data-action="goto-chat">
              <span>开始使用</span>
              <span style="font-size:18px;">→</span>
            </button>
            <button class="btn btn-secondary btn-large" data-action="goto-market">浏览模型</button>
          </div>

          <div class="flex gap-8 mt-8 text-muted" style="justify-content:center;flex-wrap:wrap;font-size:14px;">
            <div class="flex items-center gap-2">
              <span style="color:var(--color-success);">✓</span> 8 大主流模型
            </div>
            <div class="flex items-center gap-2">
              <span style="color:var(--color-success);">✓</span> 注册即送 5000 token
            </div>
            <div class="flex items-center gap-2">
              <span style="color:var(--color-success);">✓</span> 无需切换平台
            </div>
          </div>
        </div>
      </section>
    `;
  }

  function renderModels() {
    return `
      <section class="models-section" style="padding:48px 0;">
        <div class="container">
          <div class="text-center mb-8">
            <h2 class="h2 mb-2">支持的核心模型</h2>
            <p class="text-secondary">点击任意模型直接发起调用</p>
          </div>
          <div class="model-grid">
            ${ALL_MODELS.map(m => renderModelCard(m)).join('')}
          </div>
        </div>
      </section>
    `;
  }

  function renderModelCard(m) {
    const isImage = m.category === 'image';
    const price = isImage
      ? `${formatNumber(m.price_per_image)} token / 张`
      : `${m.input_price}-${m.output_price} / 千 token`;
    return `
      <div class="card card-hover model-card" data-model-id="${m.id}">
        <div class="flex items-center gap-3 mb-4">
          ${modelAvatar(m)}
          <div style="min-width:0;flex:1;">
            <div class="flex items-center gap-2 mb-1">
              <h3 class="h3" style="font-size:18px;">${escapeHTML(m.name)}</h3>
            </div>
            <div class="text-muted" style="font-size:12px;">${escapeHTML(m.provider)}</div>
          </div>
        </div>
        <p class="text-secondary mb-4" style="font-size:14px;line-height:1.6;min-height:42px;">${escapeHTML(m.description)}</p>
        <div class="flex gap-2 mb-4" style="flex-wrap:wrap;">
          ${m.tags.map(t => `<span class="badge badge-muted">${escapeHTML(t)}</span>`).join('')}
        </div>
        <div class="flex items-center justify-between pt-3" style="border-top:1px solid var(--border-color);">
          <div class="mono" style="font-size:12px;color:var(--color-accent);">${price}</div>
          <div class="text-primary-color" style="font-size:14px;font-weight:600;">${isImage ? '生成 →' : '对话 →'}</div>
        </div>
      </div>
    `;
  }

  function renderSteps() {
    const steps = [
      { n: '01', title: '注册充值', desc: '邮箱/手机号一键注册，新用户赠送 5000 token，4 档套餐随心选。' },
      { n: '02', title: '选择模型', desc: '8 大主流模型按文本/图像分类浏览，Token 消耗透明可见。' },
      { n: '03', title: '调用 AI', desc: '输入提示词，一键调用，结果与 Token 消耗实时展示。' },
    ];
    return `
      <section class="steps-section" style="padding:64px 0;">
        <div class="container">
          <div class="text-center mb-8">
            <h2 class="h2 mb-2">三步开始使用</h2>
            <p class="text-secondary">从注册到调用，5 分钟内完成</p>
          </div>
          <div class="steps-grid">
            ${steps.map(s => `
              <div class="card step-card">
                <div class="step-num mono">${s.n}</div>
                <h3 class="h3 mb-2" style="font-size:20px;">${escapeHTML(s.title)}</h3>
                <p class="text-secondary" style="line-height:1.7;">${escapeHTML(s.desc)}</p>
              </div>
            `).join('')}
          </div>
        </div>
      </section>
    `;
  }

  function renderBottomCTA() {
    return `
      <section class="cta-section" style="padding:64px 0;">
        <div class="container">
          <div class="card cta-card">
            <h2 class="h2 mb-4">立即体验 AI 聚合的力量</h2>
            <p class="text-secondary mb-6" style="font-size:18px;">
              当前支持 <span class="text-accent mono" style="font-weight:700;">${ALL_MODELS.length}</span> 个主流模型，注册即送 <span class="text-accent mono" style="font-weight:700;">5,000</span> token
            </p>
            <div class="flex gap-3" style="justify-content:center;flex-wrap:wrap;">
              <button class="btn btn-primary btn-large" data-action="goto-register">免费注册</button>
              <button class="btn btn-ghost btn-large" data-action="goto-market">查看模型</button>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  function render() {
    const root = document.getElementById('page-home');
    root.innerHTML = `
      ${renderHero()}
      ${renderModels()}
      ${renderSteps()}
      ${renderBottomCTA()}
    `;

    // 绑定事件
    root.addEventListener('click', (e) => {
      const target = e.target.closest('[data-action], .model-card');
      if (!target) return;
      const action = target.dataset.action;
      if (action === 'goto-chat') {
        if (ReservoirAPI.isLoggedIn()) navigate('chat');
        else navigate('auth', { mode: 'register' });
      } else if (action === 'goto-market') {
        navigate('market');
      } else if (action === 'goto-register') {
        navigate('auth', { mode: 'register' });
      } else if (target.classList.contains('model-card')) {
        const modelId = target.dataset.modelId;
        const m = ALL_MODELS.find(x => x.id === modelId);
        if (m.category === 'text') {
          if (ReservoirAPI.isLoggedIn()) navigate('chat', { model: modelId });
          else navigate('auth', { mode: 'register' });
        } else {
          if (ReservoirAPI.isLoggedIn()) navigate('chat', { model: modelId, mode: 'image' });
          else navigate('auth', { mode: 'register' });
        }
      }
    }, { once: false });
  }

  function onEnter() { render(); }
  window.HomePage = { onEnter };
})();

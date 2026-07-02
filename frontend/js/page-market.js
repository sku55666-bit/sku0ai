/* 水库AI - 模型市场 */
(function () {
  'use strict';
  const { ReservoirConfig } = window;
  const { TEXT_MODELS, IMAGE_MODELS } = ReservoirConfig;
  const { escapeHTML, modelAvatar, formatNumber, navigate } = window.ReservoirUI;

  let currentTab = 'all';

  function render() {
    const root = document.getElementById('page-market');
    const all = [...TEXT_MODELS, ...IMAGE_MODELS];
    const filtered = currentTab === 'all' ? all
      : currentTab === 'text' ? TEXT_MODELS
      : IMAGE_MODELS;

    root.innerHTML = `
      <div class="container" style="padding-top:24px;">
        <div class="text-center mb-8">
          <h1 class="h1 mb-3 gradient-text">模型市场</h1>
          <p class="text-secondary" style="font-size:18px;">${all.length} 个主流 AI 模型 · 统一 Token 计费</p>
        </div>

        <div class="market-tabs mb-6">
          <div class="form-tabs" style="max-width:520px;margin:0 auto;">
            <div class="form-tab ${currentTab === 'all' ? 'active' : ''}" data-tab="all">全部 (${all.length})</div>
            <div class="form-tab ${currentTab === 'text' ? 'active' : ''}" data-tab="text">文本对话 (${TEXT_MODELS.length})</div>
            <div class="form-tab ${currentTab === 'image' ? 'active' : ''}" data-tab="image">图像生成 (${IMAGE_MODELS.length})</div>
          </div>
        </div>

        <div class="market-grid">
          ${filtered.map(m => renderModelCard(m)).join('')}
        </div>

        <div class="card mt-8" style="background:var(--bg-tertiary);text-align:center;padding:32px;">
          <p class="text-secondary">
            <span class="text-accent" style="font-weight:600;">说明：</span>
            平台模型列表设计为可扩展结构，后续新增 AI 模型无需调整页面架构。
            <br>当前为静态展示，数据库启用后可实现动态管理。
          </p>
        </div>
      </div>
    `;

    // tab 切换
    root.querySelectorAll('[data-tab]').forEach(el => {
      el.addEventListener('click', () => {
        currentTab = el.dataset.tab;
        render();
      });
    });

    // 模型卡片点击
    root.querySelectorAll('.model-card').forEach(el => {
      el.addEventListener('click', () => {
        const modelId = el.dataset.modelId;
        const m = all.find(x => x.id === modelId);
        if (m.category === 'text') {
          if (ReservoirAPI.isLoggedIn()) navigate('chat', { model: modelId });
          else navigate('auth', { mode: 'register' });
        } else {
          if (ReservoirAPI.isLoggedIn()) navigate('chat', { model: modelId, mode: 'image' });
          else navigate('auth', { mode: 'register' });
        }
      });
    });
  }

  function renderModelCard(m) {
    const isImage = m.category === 'image';
    const price = isImage
      ? `${formatNumber(m.price_per_image)} token / 张`
      : `输入 ${m.input_price} / 输出 ${m.output_price} (千 token)`;
    const resolutions = isImage
      ? `<div class="text-muted" style="font-size:12px;">支持分辨率: ${m.resolutions.join(' / ')}</div>`
      : `<div class="text-muted" style="font-size:12px;">上下文: ${(m.context_window / 1000).toFixed(0)}K · 最大输出: ${(m.max_output / 1000).toFixed(0)}K</div>`;

    return `
      <div class="card card-hover model-card" data-model-id="${m.id}">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-3">
            ${modelAvatar(m)}
            <div>
              <h3 class="h3" style="font-size:20px;">${escapeHTML(m.name)}</h3>
              <div class="text-muted" style="font-size:12px;">${escapeHTML(m.provider)}</div>
            </div>
          </div>
          <span class="badge ${isImage ? 'badge-accent' : 'badge'}">${isImage ? '图像' : '文本'}</span>
        </div>
        <p class="text-secondary mb-4" style="line-height:1.7;">${escapeHTML(m.description)}</p>
        <div class="flex gap-2 mb-4" style="flex-wrap:wrap;">
          ${m.tags.map(t => `<span class="badge badge-muted">${escapeHTML(t)}</span>`).join('')}
        </div>
        <div class="model-pricing" style="padding:12px 16px;background:var(--bg-tertiary);border-radius:10px;border:1px solid var(--border-color);">
          <div class="flex items-center justify-between mb-2">
            <div class="text-muted" style="font-size:12px;">计费标准</div>
            <div class="mono text-accent" style="font-size:13px;font-weight:600;">${price}</div>
          </div>
          ${resolutions}
        </div>
        <button class="btn btn-primary btn-block mt-4">${isImage ? '立即生成' : '开始对话'}</button>
      </div>
    `;
  }

  function onEnter() { render(); }
  window.MarketPage = { onEnter };
})();

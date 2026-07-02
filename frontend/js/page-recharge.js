/* 水库AI - 充值页 */
(function () {
  'use strict';
  const { ReservoirConfig, ReservoirAPI } = window;
  const { RECHARGE_PACKAGES, CUSTOM_RATE } = ReservoirConfig;
  const { escapeHTML, formatNumber, formatCNY, navigate, showToast, animateNumber, showModal } = window.ReservoirUI;

  let state = {
    balance: 0,
    selectedPackage: RECHARGE_PACKAGES[1].name, // 默认标准版
    customAmount: '',
    paying: false,
  };

  async function refreshBalance() {
    try {
      const r = await ReservoirAPI.getBalance();
      state.balance = r.balance;
      renderBalance(true);
    } catch (e) {}
  }

  function renderBalance(animate = false) {
    const el = document.getElementById('recharge-balance-value');
    if (!el) return;
    if (animate) {
      const old = parseInt(el.dataset.value || '0', 10);
      animateNumber(el, old, state.balance, 600);
    } else {
      el.textContent = formatNumber(state.balance);
    }
    el.dataset.value = state.balance;
  }

  function render() {
    if (!ReservoirAPI.isLoggedIn()) {
      navigate('auth', { mode: 'login' });
      return;
    }
    const root = document.getElementById('page-recharge');
    root.innerHTML = `
      <div class="container-narrow" style="padding-top:24px;">
        <div class="text-center mb-8">
          <h1 class="h1 mb-2 gradient-text">充值 Token</h1>
          <p class="text-secondary">选择套餐或自定义金额，演示版本点击即到账</p>
        </div>

        <div class="card balance-card mb-6">
          <div class="text-muted" style="font-size:13px;">当前 Token 余额</div>
          <div id="recharge-balance-value" class="mono text-accent" style="font-size:42px;font-weight:800;line-height:1.1;margin:6px 0 4px;">${formatNumber(state.balance)}</div>
          <div class="text-muted" style="font-size:12px;">约可调用 ${Math.floor(state.balance / 20)} 次文本对话 / ${Math.floor(state.balance / 800)} 张图像</div>
        </div>

        <h3 class="h3 mb-4">充值套餐</h3>
        <div class="packages-grid mb-6">
          ${RECHARGE_PACKAGES.map(p => `
            <div class="package-card card card-hover ${p.name === state.selectedPackage ? 'selected' : ''} ${p.highlight ? 'highlight' : ''}" data-pkg="${p.name}">
              ${p.highlight ? '<div class="package-tag">人气推荐</div>' : ''}
              <div class="package-name">${escapeHTML(p.name)}</div>
              <div class="package-price mono">${formatCNY(p.amount_cny)}</div>
              <div class="package-tokens mono text-accent">${formatNumber(p.token_amount)} token</div>
              <div class="package-extra">${escapeHTML(p.tag)}</div>
              <div class="package-rate">1 元 ≈ ${Math.floor(p.token_amount / p.amount_cny)} token</div>
            </div>
          `).join('')}
        </div>

        <h3 class="h3 mb-4">自定义金额</h3>
        <div class="card mb-6">
          <div class="custom-row">
            <div class="custom-input-group">
              <span class="custom-prefix">¥</span>
              <input type="number" id="custom-amount" class="custom-input" placeholder="输入金额（1-100000）" value="${escapeHTML(state.customAmount)}" min="1" max="100000" step="1" />
              <span class="custom-suffix">.00</span>
            </div>
            <div class="custom-amount-info">
              <div class="text-muted" style="font-size:12px;">将获得</div>
              <div class="mono text-accent" style="font-size:20px;font-weight:700;">${formatNumber(getCustomTokens())} token</div>
            </div>
          </div>
        </div>

        <button class="btn btn-primary btn-block btn-large" data-action="pay" ${state.paying ? 'disabled' : ''}>
          ${state.paying ? '支付处理中...' : `立即充值 ${getPaymentAmountText()}`}
        </button>

        <div class="payment-methods mt-4">
          <div class="text-muted text-center" style="font-size:13px;">支付方式</div>
          <div class="payment-icons">
            <div class="payment-icon active">
              <div class="payment-icon-logo" style="background:#1677FF;">支</div>
              <span>支付宝</span>
            </div>
            <div class="payment-icon disabled">
              <div class="payment-icon-logo" style="background:#07C160;">微</div>
              <span>微信支付</span>
            </div>
          </div>
          <div class="text-muted text-center mt-4" style="font-size:12px;">演示版本：点击支付按钮后自动到账，不接入真实支付通道</div>
        </div>

        <div class="card mt-8 recharge-tips">
          <h3 class="h3 mb-4" style="font-size:18px;">Token 使用说明</h3>
          <ul class="text-secondary" style="line-height:1.9;padding-left:20px;">
            <li>不同模型 Token 消耗不同，文本对话按输入+输出 token 数计费</li>
            <li>图像生成按张数/分辨率计费，单价 400-900 token / 张</li>
            <li>Token 永久有效，账户内余额不过期</li>
            <li>充值后立即到账，可立即用于所有 AI 模型调用</li>
            <li>如需发票或企业批量充值，请联系商务团队</li>
          </ul>
        </div>
      </div>
    `;
    bindEvents();
  }

  function getCustomTokens() {
    const amount = parseFloat(state.customAmount);
    if (!amount || amount <= 0) return 0;
    return Math.floor(amount * CUSTOM_RATE);
  }

  function getSelectedPackage() {
    return RECHARGE_PACKAGES.find(p => p.name === state.selectedPackage);
  }

  function getPaymentAmountText() {
    if (state.customAmount && parseFloat(state.customAmount) > 0) {
      return formatCNY(parseFloat(state.customAmount));
    }
    const pkg = getSelectedPackage();
    return pkg ? formatCNY(pkg.amount_cny) : '¥0.00';
  }

  function bindEvents() {
    const root = document.getElementById('page-recharge');

    // 套餐选择
    root.querySelectorAll('.package-card').forEach(el => {
      el.addEventListener('click', () => {
        state.selectedPackage = el.dataset.pkg;
        state.customAmount = '';
        render();
      });
    });

    // 自定义金额
    const customInput = document.getElementById('custom-amount');
    if (customInput) {
      customInput.addEventListener('input', (e) => {
        state.customAmount = e.target.value;
        state.selectedPackage = null;
        // 只更新右侧 token 数量展示
        const info = root.querySelector('.custom-amount-info .mono');
        if (info) info.textContent = formatNumber(getCustomTokens());
        // 更新支付按钮
        const btn = root.querySelector('[data-action="pay"]');
        if (btn) btn.innerHTML = `立即充值 ${getPaymentAmountText()}`;
      });
    }

    // 支付
    root.querySelector('[data-action="pay"]').addEventListener('click', async () => {
      if (state.paying) return;
      const pkg = getSelectedPackage();
      const amount = pkg ? pkg.amount_cny : parseFloat(state.customAmount);
      if (!amount || amount <= 0) {
        showToast('请选择套餐或输入金额', 'warning');
        return;
      }

      const confirmed = await showModal({
        title: '确认支付',
        desc: `将使用支付宝支付 <strong style="color:var(--color-accent)">${formatCNY(amount)}</strong>，预计获得 <strong style="color:var(--color-accent)">${pkg ? formatNumber(pkg.token_amount) : formatNumber(getCustomTokens())}</strong> token。<br><br>演示版本：点击确认将立即到账。`,
        confirmText: '确认支付',
        cancelText: '取消',
      });
      if (!confirmed) return;

      state.paying = true;
      render();
      try {
        const order = await ReservoirAPI.createRecharge({
          amount_cny: amount,
          package_name: pkg ? pkg.name : null,
        });
        // 模拟支付延迟
        await new Promise(r => setTimeout(r, 800));
        const r = await ReservoirAPI.verifyRecharge({ order_no: order.order_no });
        state.paying = false;
        const oldBal = state.balance;
        state.balance = r.balance_after;
        state.customAmount = '';
        render();
        // 动画更新余额
        setTimeout(() => {
          const el = document.getElementById('recharge-balance-value');
          if (el) animateNumber(el, oldBal, state.balance, 800);
          // header
          const headerEl = document.getElementById('header-balance-value');
          if (headerEl) animateNumber(headerEl, oldBal, state.balance, 800);
        }, 50);
        showToast(`充值成功 +${formatNumber(r.token_amount)} token`, 'success', 3000);
      } catch (e) {
        state.paying = false;
        render();
        showToast('支付失败：' + e.message, 'error', 3000);
      }
    });
  }

  async function onEnter() {
    await refreshBalance();
    render();
  }

  window.RechargePage = { onEnter };
})();

/* 水库AI - 主应用入口 */
(function () {
  'use strict';
  const { ReservoirAPI, ReservoirConfig } = window;
  const { navigate, onRouteChange, getRouteFromHash, formatNumber, showToast } = window.ReservoirUI;

  // 页面注册表
  const pages = {
    home: () => window.HomePage,
    market: () => window.MarketPage,
    chat: () => window.ChatPage,
    recharge: () => window.RechargePage,
    auth: () => window.AuthPage,
    profile: () => window.ProfilePage,
  };

  // 渲染 header
  function renderHeader() {
    const header = document.getElementById('app-header');
    const loggedIn = ReservoirAPI.isLoggedIn();
    header.innerHTML = `
      <a class="logo" href="#home">
        <div class="logo-icon">AI</div>
        <span>水库AI</span>
      </a>
      <nav class="nav-menu">
        <a class="nav-item" data-page="home" href="#home">
          <span class="nav-icon">🏠</span>
          <span>首页</span>
        </a>
        <a class="nav-item" data-page="market" href="#market">
          <span class="nav-icon">📦</span>
          <span>模型市场</span>
        </a>
        <a class="nav-item" data-page="chat" href="#chat">
          <span class="nav-icon">💬</span>
          <span>AI 对话</span>
        </a>
        <a class="nav-item" data-page="recharge" href="#recharge">
          <span class="nav-icon">💎</span>
          <span>充值</span>
        </a>
        <a class="nav-item" data-page="profile" href="#profile">
          <span class="nav-icon">👤</span>
          <span>我的</span>
        </a>
      </nav>
      <div class="header-right">
        ${loggedIn ? `
          <a class="balance-pill" href="#recharge" title="点击充值">
            <span>💎</span>
            <span class="amount" id="header-balance-value">0</span>
            <span class="text-muted" style="font-size:11px;">token</span>
          </a>
          <a class="btn btn-ghost" href="#profile" style="padding:6px 14px;font-size:13px;">个人中心</a>
        ` : `
          <a class="btn btn-ghost" href="#auth?mode=login" style="padding:8px 16px;">登录</a>
          <a class="btn btn-primary" href="#auth?mode=register" style="padding:8px 16px;">免费注册</a>
        `}
      </div>
    `;

    // 绑定 header 内的跳转（防止默认行为）
    header.querySelectorAll('[data-page]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        navigate(el.dataset.page);
      });
    });
  }

  async function refreshHeaderBalance() {
    if (!ReservoirAPI.isLoggedIn()) return;
    try {
      const r = await ReservoirAPI.getBalance();
      const el = document.getElementById('header-balance-value');
      if (el) el.textContent = formatNumber(r.balance);
    } catch (e) {}
  }

  // 路由切换
  onRouteChange(async (page, params) => {
    // 更新 nav active
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.page === page);
    });
    // 触发对应页面
    const mod = pages[page] && pages[page]();
    if (mod && typeof mod.onEnter === 'function') {
      try {
        await mod.onEnter(params);
      } catch (e) {
        console.error('Page render error:', e);
        showToast('页面加载失败：' + e.message, 'error');
      }
    } else {
      console.warn('No page module found for:', page);
    }
  });

  // 启动
  async function init() {
    renderHeader();
    await refreshHeaderBalance();

    const { page, params } = getRouteFromHash();
    if (pages[page]) {
      navigate(page, params);
    } else {
      navigate('home');
    }
  }

  // 处理浏览器前进后退
  window.addEventListener('popstate', () => {
    const { page, params } = getRouteFromHash();
    if (pages[page]) {
      navigate(page, params);
    } else {
      navigate('home');
    }
  });

  // DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

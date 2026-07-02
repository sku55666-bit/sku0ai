/* 水库AI - 个人中心 */
(function () {
  'use strict';
  const { ReservoirAPI } = window;
  const { escapeHTML, formatNumber, formatCNY, formatDate, navigate, showToast, animateNumber, showModal } = window.ReservoirUI;

  let state = {
    user: null,
    balance: 0,
    activeTab: 'usage',   // 'usage' | 'recharge' | 'settings'
    usageList: [],
    rechargeList: [],
    usagePage: 1,
    rechargePage: 1,
    pageSize: 20,
  };

  async function loadUser() {
    const r = await ReservoirAPI.getCurrentUser();
    state.user = r.user;
    const b = await ReservoirAPI.getBalance();
    state.balance = b.balance;
  }

  async function loadUsage(reset = false) {
    if (reset) state.usagePage = 1;
    const r = await ReservoirAPI.usageRecords({ page: state.usagePage, page_size: state.pageSize });
    state.usageList = reset ? r.records : [...state.usageList, ...r.records];
  }

  async function loadRecharge(reset = false) {
    if (reset) state.rechargePage = 1;
    const r = await ReservoirAPI.rechargeRecords({ page: state.rechargePage, page_size: state.pageSize });
    state.rechargeList = reset ? r.records : [...state.rechargeList, ...r.records];
  }

  function render() {
    if (!ReservoirAPI.isLoggedIn()) {
      navigate('auth', { mode: 'login' });
      return;
    }
    const root = document.getElementById('page-profile');
    const u = state.user;
    root.innerHTML = `
      <div class="container" style="padding-top:24px;">
        <div class="profile-header card mb-6">
          <div class="profile-avatar-row">
            <div class="profile-avatar">${escapeHTML((u.nickname || u.identifier).charAt(0).toUpperCase())}</div>
            <div style="flex:1;min-width:0;">
              <h2 class="h2" style="font-size:24px;margin-bottom:2px;">${escapeHTML(u.nickname || '未设置昵称')}</h2>
              <div class="text-muted" style="font-size:13px;">${escapeHTML(u.identifier)}</div>
              <div class="text-muted mt-2" style="font-size:12px;">注册于 ${formatDate(u.created_at)}</div>
            </div>
          </div>

          <div class="profile-stats">
            <div class="stat-card">
              <div class="text-muted" style="font-size:12px;">Token 余额</div>
              <div class="mono text-accent" style="font-size:28px;font-weight:800;line-height:1.1;">${formatNumber(state.balance)}</div>
            </div>
            <div class="stat-card">
              <div class="text-muted" style="font-size:12px;">累计消费</div>
              <div class="mono" style="font-size:28px;font-weight:800;line-height:1.1;color:var(--text-primary);">${formatNumber(u.total_spent)}</div>
            </div>
            <div class="stat-card">
              <div class="text-muted" style="font-size:12px;">累计调用</div>
              <div class="mono" style="font-size:28px;font-weight:800;line-height:1.1;color:var(--text-primary);">${formatNumber(u.total_calls)}</div>
              <div class="text-muted" style="font-size:11px;">次</div>
            </div>
            <div class="stat-card">
              <button class="btn btn-primary btn-block" data-action="go-recharge">立即充值</button>
            </div>
          </div>
        </div>

        <div class="form-tabs mb-4">
          <div class="form-tab ${state.activeTab === 'usage' ? 'active' : ''}" data-tab="usage">消费记录</div>
          <div class="form-tab ${state.activeTab === 'recharge' ? 'active' : ''}" data-tab="recharge">充值记录</div>
          <div class="form-tab ${state.activeTab === 'settings' ? 'active' : ''}" data-tab="settings">账户设置</div>
        </div>

        <div class="tab-content">
          ${state.activeTab === 'usage' ? renderUsageTab() : ''}
          ${state.activeTab === 'recharge' ? renderRechargeTab() : ''}
          ${state.activeTab === 'settings' ? renderSettingsTab() : ''}
        </div>
      </div>
    `;
    bindEvents();
  }

  function renderUsageTab() {
    if (state.usageList.length === 0) {
      return `
        <div class="card empty-card">
          <div class="text-center" style="padding:48px 16px;">
            <div style="font-size:48px;margin-bottom:16px;">📋</div>
            <h3 class="h3 mb-2">还没有消费记录</h3>
            <p class="text-secondary mb-6">开始你的第一次 AI 调用吧</p>
            <button class="btn btn-primary" data-action="go-chat">立即体验</button>
          </div>
        </div>
      `;
    }
    return `
      <div class="card" style="padding:0;overflow:hidden;">
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>时间</th>
                <th>模型</th>
                <th>类型</th>
                <th>Token 消耗</th>
                <th>提示词</th>
                <th>状态</th>
              </tr>
            </thead>
            <tbody>
              ${state.usageList.map(r => `
                <tr>
                  <td class="text-muted" style="font-size:12px;white-space:nowrap;">${formatDate(r.created_at)}</td>
                  <td><span class="badge">${escapeHTML(r.model_name)}</span></td>
                  <td>${r.call_type === 'text' ? '💬 文本' : '🎨 图像'}</td>
                  <td class="mono text-accent" style="font-weight:600;">-${formatNumber(r.cost_tokens)}</td>
                  <td class="text-secondary" style="max-width:280px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:13px;" title="${escapeHTML(r.prompt_preview || '')}">${escapeHTML(r.prompt_preview || '-')}</td>
                  <td><span class="badge ${r.status === 'success' ? 'badge-success' : 'badge-error'}">${r.status === 'success' ? '成功' : '失败'}</span></td>
                </tr>
                ${r.image_url ? `
                  <tr>
                    <td colspan="6" style="padding:8px 16px;background:var(--bg-tertiary);">
                      <div class="flex items-center gap-3">
                        <img src="${r.image_url}" style="width:80px;height:80px;border-radius:8px;object-fit:cover;" />
                        <div style="flex:1;min-width:0;">
                          <div class="text-muted" style="font-size:12px;margin-bottom:4px;">生成结果</div>
                          <div class="text-secondary" style="font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHTML(r.result_preview || '')}</div>
                        </div>
                        <a href="${r.image_url}" target="_blank" class="btn btn-ghost" style="padding:4px 12px;font-size:12px;">查看大图</a>
                      </div>
                    </td>
                  </tr>
                ` : ''}
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  function renderRechargeTab() {
    if (state.rechargeList.length === 0) {
      return `
        <div class="card empty-card">
          <div class="text-center" style="padding:48px 16px;">
            <div style="font-size:48px;margin-bottom:16px;">💳</div>
            <h3 class="h3 mb-2">还没有充值记录</h3>
            <p class="text-secondary mb-6">充值 Token 享受更优惠的价格</p>
            <button class="btn btn-primary" data-action="go-recharge">前往充值</button>
          </div>
        </div>
      `;
    }
    return `
      <div class="card" style="padding:0;overflow:hidden;">
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>订单号</th>
                <th>套餐</th>
                <th>金额</th>
                <th>获得 Token</th>
                <th>状态</th>
                <th>支付时间</th>
              </tr>
            </thead>
            <tbody>
              ${state.rechargeList.map(r => `
                <tr>
                  <td class="mono" style="font-size:12px;color:var(--text-muted);">${escapeHTML(r.order_no)}</td>
                  <td>${escapeHTML(r.package_name || '-')}</td>
                  <td class="mono" style="color:var(--text-primary);font-weight:600;">${formatCNY(r.amount_cny)}</td>
                  <td class="mono text-accent" style="font-weight:600;">+${formatNumber(r.token_amount)}</td>
                  <td><span class="badge ${r.status === 'paid' ? 'badge-success' : r.status === 'pending' ? 'badge-warning' : 'badge-error'}">${r.status === 'paid' ? '已支付' : r.status === 'pending' ? '待支付' : '失败'}</span></td>
                  <td class="text-muted" style="font-size:12px;">${formatDate(r.paid_at || r.created_at)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  function renderSettingsTab() {
    const u = state.user;
    return `
      <div class="card">
        <h3 class="h3 mb-4" style="font-size:20px;">基本信息</h3>
        <div class="form-group">
          <label class="form-label">用户 ID</label>
          <input class="form-input" value="#${u.id}" readonly />
        </div>
        <div class="form-group">
          <label class="form-label">${u.identifier_type === 'email' ? '邮箱' : '手机号'}</label>
          <input class="form-input" value="${escapeHTML(u.identifier)}" readonly />
        </div>
        <div class="form-group">
          <label class="form-label">昵称</label>
          <input class="form-input" id="settings-nickname" value="${escapeHTML(u.nickname || '')}" placeholder="设置一个昵称" />
        </div>
        <div class="form-group">
          <label class="form-label">账户类型</label>
          <input class="form-input" value="标准用户" readonly />
        </div>
        <button class="btn btn-primary" data-action="save-settings">保存修改</button>
      </div>

      <div class="card mt-6">
        <h3 class="h3 mb-4" style="font-size:20px;">数据管理</h3>
        <p class="text-secondary mb-4" style="font-size:14px;">演示版本：清除浏览器本地数据，重置所有用户、订单、消费记录。</p>
        <button class="btn btn-ghost" data-action="reset-demo" style="color:var(--color-error);border-color:rgba(239,68,68,0.3);">重置演示数据</button>
      </div>

      <div class="card mt-6">
        <h3 class="h3 mb-4" style="font-size:20px;">安全操作</h3>
        <p class="text-secondary mb-4" style="font-size:14px;">退出当前账户登录状态。</p>
        <button class="btn btn-ghost" data-action="logout">退出登录</button>
      </div>
    `;
  }

  function bindEvents() {
    const root = document.getElementById('page-profile');

    root.querySelectorAll('[data-tab]').forEach(el => {
      el.addEventListener('click', async () => {
        const tab = el.dataset.tab;
        if (tab === state.activeTab) return;
        state.activeTab = tab;
        if (tab === 'usage' && state.usageList.length === 0) await loadUsage(true);
        if (tab === 'recharge' && state.rechargeList.length === 0) await loadRecharge(true);
        render();
      });
    });

    root.addEventListener('click', async (e) => {
      const t = e.target.closest('[data-action]');
      if (!t) return;
      const a = t.dataset.action;
      if (a === 'go-recharge') navigate('recharge');
      else if (a === 'go-chat') navigate('chat');
      else if (a === 'save-settings') {
        const nickname = document.getElementById('settings-nickname').value.trim();
        if (!nickname) {
          showToast('请输入昵称', 'warning');
          return;
        }
        try {
          await ReservoirAPI.updateNickname(nickname);
          state.user.nickname = nickname;
          showToast('保存成功', 'success');
        } catch (e) {
          showToast(e.message, 'error');
        }
      } else if (a === 'reset-demo') {
        const ok = await showModal({
          title: '重置演示数据',
          desc: '将清除浏览器中所有账户、订单、消费记录。此操作不可恢复。',
          confirmText: '确认重置',
          cancelText: '取消',
          danger: true,
        });
        if (ok) {
          ReservoirAPI.resetDemo();
          showToast('已重置，即将跳转首页', 'success');
          setTimeout(() => navigate('home'), 800);
        }
      } else if (a === 'logout') {
        const ok = await showModal({
          title: '退出登录',
          desc: '退出后需要重新登录，是否继续？',
          confirmText: '退出',
          cancelText: '取消',
        });
        if (ok) {
          await ReservoirAPI.logout();
          showToast('已退出登录', 'info');
          navigate('home');
        }
      }
    });
  }

  async function onEnter() {
    if (!ReservoirAPI.isLoggedIn()) {
      navigate('auth', { mode: 'login' });
      return;
    }
    await loadUser();
    if (state.activeTab === 'usage') await loadUsage(true);
    else if (state.activeTab === 'recharge') await loadRecharge(true);
    render();
    // 更新 header 余额
    const el = document.getElementById('header-balance-value');
    if (el) el.textContent = formatNumber(state.balance);
  }

  window.ProfilePage = { onEnter };
})();

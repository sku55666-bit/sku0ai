/* 水库AI - 登录/注册页 */
(function () {
  'use strict';
  const { ReservoirAPI } = window;
  const { escapeHTML, showToast, navigate } = window.ReservoirUI;

  let state = {
    mode: 'register',     // 'register' or 'login'
    channel: 'email',     // 'email' or 'phone'
    step: 1,              // 1: 填写账号, 2: 验证 OTP, 3: 完成
    identifier: '',
    countdown: 0,
  };

  function validateIdentifier() {
    if (state.channel === 'email') {
      return /^[\w.+-]+@[\w-]+\.[\w.-]+$/.test(state.identifier);
    } else {
      return /^1[3-9]\d{9}$/.test(state.identifier);
    }
  }

  function render() {
    const root = document.getElementById('page-auth');
    const tip = state.mode === 'register'
      ? '注册后立即获得 5,000 token'
      : '使用邮箱或手机号登录';

    root.innerHTML = `
      <div class="auth-page">
        <div class="auth-container">
          <div class="auth-header text-center mb-6">
            <div class="auth-logo">
              <div class="logo-icon" style="width:56px;height:56px;font-size:24px;margin:0 auto 16px;">AI</div>
            </div>
            <h1 class="h2 mb-2">${state.mode === 'register' ? '创建账户' : '欢迎回来'}</h1>
            <p class="text-secondary">${escapeHTML(tip)}</p>
          </div>

          <div class="card auth-card">
            <div class="form-tabs mb-4">
              <div class="form-tab ${state.mode === 'register' ? 'active' : ''}" data-mode="register">注册</div>
              <div class="form-tab ${state.mode === 'login' ? 'active' : ''}" data-mode="login">登录</div>
            </div>

            <div class="form-tabs mb-6">
              <div class="form-tab ${state.channel === 'email' ? 'active' : ''}" data-channel="email">📧 邮箱</div>
              <div class="form-tab ${state.channel === 'phone' ? 'active' : ''}" data-channel="phone">📱 手机号</div>
            </div>

            ${state.step === 1 ? renderStep1() : ''}
            ${state.step === 2 ? renderStep2() : ''}
            ${state.step === 3 ? renderStep3() : ''}
          </div>

          <div class="text-center mt-6 text-muted" style="font-size:13px;">
            ${state.mode === 'register' ? '已有账户?' : '还没有账户?'}
            <a href="javascript:void(0)" data-toggle-mode style="color:var(--color-primary);font-weight:600;margin-left:4px;">
              ${state.mode === 'register' ? '立即登录' : '立即注册'}
            </a>
          </div>
        </div>
      </div>
    `;
    bindEvents();
  }

  function renderStep1() {
    const placeholder = state.channel === 'email' ? '请输入邮箱地址' : '请输入手机号';
    return `
      <form class="auth-form" data-action="submit-identifier">
        <div class="form-group">
          <label class="form-label">${state.channel === 'email' ? '邮箱地址' : '手机号码'}</label>
          <input
            type="${state.channel === 'email' ? 'email' : 'tel'}"
            id="auth-identifier"
            class="form-input"
            placeholder="${placeholder}"
            value="${escapeHTML(state.identifier)}"
            required
            autocomplete="${state.channel === 'email' ? 'email' : 'tel'}"
          />
        </div>
        <button type="submit" class="btn btn-primary btn-block btn-large">
          ${state.mode === 'register' ? '获取验证码' : '获取登录验证码'}
        </button>
      </form>

      <div class="auth-tips">
        <p class="text-muted" style="font-size:13px;line-height:1.7;">
          📌 <span class="text-secondary" style="font-weight:600;">演示说明</span>：沙箱环境下验证码不会真发邮件/短信，点击「获取验证码」后直接弹窗显示 6 位码，可自动填入测试。
        </p>
      </div>
    `;
  }

  function renderStep2() {
    return `
      <div class="text-center mb-4">
        <div class="text-muted" style="font-size:13px;">验证码已发送至</div>
        <div class="text-primary-color" style="font-weight:600;margin-top:4px;">${escapeHTML(state.identifier)}</div>
      </div>

      <form class="auth-form" data-action="submit-otp">
        <div class="form-group">
          <label class="form-label">6 位验证码</label>
          <div class="otp-input-row">
            <input type="text" class="otp-input" data-idx="0" maxlength="1" inputmode="numeric" />
            <input type="text" class="otp-input" data-idx="1" maxlength="1" inputmode="numeric" />
            <input type="text" class="otp-input" data-idx="2" maxlength="1" inputmode="numeric" />
            <input type="text" class="otp-input" data-idx="3" maxlength="1" inputmode="numeric" />
            <input type="text" class="otp-input" data-idx="4" maxlength="1" inputmode="numeric" />
            <input type="text" class="otp-input" data-idx="5" maxlength="1" inputmode="numeric" />
          </div>
        </div>
        <button type="submit" class="btn btn-primary btn-block btn-large">${state.mode === 'register' ? '注册并登录' : '登录'}</button>

        <div class="text-center mt-4" style="font-size:14px;">
          <span class="text-muted">没收到？</span>
          <a href="javascript:void(0)" data-action="resend" style="color:var(--color-primary);font-weight:600;${state.countdown > 0 ? 'opacity:0.5;pointer-events:none;' : ''}">
            ${state.countdown > 0 ? `${state.countdown}s 后重新发送` : '重新发送'}
          </a>
        </div>
        <div class="text-center mt-3">
          <a href="javascript:void(0)" data-action="back" style="color:var(--text-secondary);font-size:13px;">← 返回上一步</a>
        </div>
      </form>
    `;
  }

  function renderStep3() {
    return `
      <div class="text-center success-state">
        <div class="success-icon">✓</div>
        <h2 class="h2 mb-3">${state.mode === 'register' ? '注册成功' : '登录成功'}</h2>
        <p class="text-secondary mb-6">${state.mode === 'register' ? '已为您赠送 5,000 token，立即开始使用吧！' : '欢迎回来，Token 余额已恢复'}</p>
        <button class="btn btn-primary btn-block btn-large" data-action="go-chat">开始使用</button>
        <button class="btn btn-ghost btn-block mt-3" data-action="go-home">返回首页</button>
      </div>
    `;
  }

  function bindEvents() {
    const root = document.getElementById('page-auth');

    // 切换登录/注册
    root.querySelectorAll('[data-mode]').forEach(el => {
      el.addEventListener('click', () => {
        state.mode = el.dataset.mode;
        state.step = 1;
        state.identifier = '';
        render();
      });
    });

    // 切换渠道
    root.querySelectorAll('[data-channel]').forEach(el => {
      el.addEventListener('click', () => {
        state.channel = el.dataset.channel;
        state.identifier = '';
        render();
      });
    });

    // 切换登录注册链接
    const toggleBtn = root.querySelector('[data-toggle-mode]');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        state.mode = state.mode === 'register' ? 'login' : 'register';
        state.step = 1;
        render();
      });
    }

    // 表单提交
    const form = root.querySelector('form');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const action = form.dataset.action;
        if (action === 'submit-identifier') {
          await handleSubmitIdentifier();
        } else if (action === 'submit-otp') {
          await handleSubmitOtp();
        }
      });
    }

    // OTP 输入框
    const otpInputs = root.querySelectorAll('.otp-input');
    if (otpInputs.length) {
      otpInputs[0].focus();
      otpInputs.forEach((inp, idx) => {
        inp.addEventListener('input', (e) => {
          const v = e.target.value.replace(/\D/g, '');
          e.target.value = v;
          if (v && idx < 5) {
            otpInputs[idx + 1].focus();
          }
        });
        inp.addEventListener('keydown', (e) => {
          if (e.key === 'Backspace' && !e.target.value && idx > 0) {
            otpInputs[idx - 1].focus();
          }
        });
        inp.addEventListener('paste', (e) => {
          e.preventDefault();
          const text = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, 6);
          text.split('').forEach((c, i) => {
            if (otpInputs[i]) otpInputs[i].value = c;
          });
          if (text.length === 6) otpInputs[5].focus();
          else if (text.length > 0) otpInputs[text.length].focus();
        });
      });
    }

    // 操作按钮
    root.addEventListener('click', async (e) => {
      const t = e.target.closest('[data-action]');
      if (!t) return;
      const a = t.dataset.action;
      if (a === 'resend') await requestOtp();
      else if (a === 'back') { state.step = 1; render(); }
      else if (a === 'go-chat') navigate('chat');
      else if (a === 'go-home') navigate('home');
    });
  }

  async function handleSubmitIdentifier() {
    const id = document.getElementById('auth-identifier').value.trim();
    if (!id) {
      showToast('请输入' + (state.channel === 'email' ? '邮箱' : '手机号'), 'warning');
      return;
    }
    if (!validateIdentifier()) {
      showToast('格式不正确', 'error');
      return;
    }
    state.identifier = id;

    // 注册场景：先创建账户
    if (state.mode === 'register') {
      try {
        await ReservoirAPI.register({
          identifier: id,
          identifier_type: state.channel,
        });
        // 立刻请求 OTP 用于登录
        await requestOtp();
      } catch (e) {
        if (e.message.includes('已注册')) {
          state.mode = 'login';
          showToast('该账户已注册，请使用登录', 'warning');
          await requestOtp();
        } else {
          showToast(e.message, 'error');
        }
      }
    } else {
      await requestOtp();
    }
  }

  async function requestOtp() {
    try {
      const r = await ReservoirAPI.requestOtp({
        identifier: state.identifier,
        identifier_type: state.channel,
        purpose: state.mode === 'register' ? 'register' : 'login',
      });
      state.step = 2;
      render();
      // 演示：直接自动填入
      setTimeout(() => {
        const inputs = document.querySelectorAll('.otp-input');
        if (inputs.length && r.demo_code) {
          r.demo_code.split('').forEach((c, i) => {
            if (inputs[i]) inputs[i].value = c;
          });
          showToast(`演示验证码：${r.demo_code}（已自动填入）`, 'info', 3500);
        }
      }, 100);
      startCountdown(60);
    } catch (e) {
      showToast(e.message, 'error', 3000);
    }
  }

  function startCountdown(seconds) {
    state.countdown = seconds;
    const t = setInterval(() => {
      state.countdown -= 1;
      const link = document.querySelector('[data-action="resend"]');
      if (link) {
        if (state.countdown > 0) {
          link.textContent = `${state.countdown}s 后重新发送`;
          link.style.opacity = '0.5';
          link.style.pointerEvents = 'none';
        } else {
          link.textContent = '重新发送';
          link.style.opacity = '1';
          link.style.pointerEvents = 'auto';
        }
      }
      if (state.countdown <= 0) clearInterval(t);
    }, 1000);
  }

  async function handleSubmitOtp() {
    const inputs = document.querySelectorAll('.otp-input');
    const code = Array.from(inputs).map(i => i.value).join('');
    if (code.length !== 6) {
      showToast('请输入完整 6 位验证码', 'warning');
      return;
    }
    try {
      let r;
      if (state.mode === 'register') {
        // 已经注册过，直接 verify
        r = await ReservoirAPI.verifyOtp({
          identifier: state.identifier,
          code,
          purpose: 'register',
        });
      } else {
        r = await ReservoirAPI.verifyOtp({
          identifier: state.identifier,
          code,
          purpose: 'login',
        });
      }
      state.step = 3;
      render();
      // 更新 header 余额
      try {
        const bal = await ReservoirAPI.getBalance();
        const el = document.getElementById('header-balance-value');
        if (el) el.textContent = formatNumber(bal.balance);
      } catch (e) {}
    } catch (e) {
      showToast(e.message, 'error', 3000);
      // 清空 input
      inputs.forEach(i => i.value = '');
      inputs[0].focus();
    }
  }

  function formatNumber(n) {
    return Number(n).toLocaleString('zh-CN');
  }

  function onEnter(params = {}) {
    state.mode = params.mode === 'login' ? 'login' : 'register';
    state.step = 1;
    state.identifier = '';
    render();
  }

  window.AuthPage = { onEnter };
})();

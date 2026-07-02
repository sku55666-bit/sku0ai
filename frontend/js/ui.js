/* 水库AI - 工具函数
   Toast、Modal、动画、格式化等
*/

(function (global) {
  'use strict';

  // ===== Toast 提示 =====
  const toastContainer = () => {
    let el = document.querySelector('.toast-container');
    if (!el) {
      el = document.createElement('div');
      el.className = 'toast-container';
      document.body.appendChild(el);
    }
    return el;
  };

  function showToast(message, type = 'info', duration = 2500) {
    const container = toastContainer();
    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    const icon = {
      success: '✓', error: '✕', warning: '⚠', info: 'ℹ'
    }[type] || 'ℹ';
    el.innerHTML = `<span style="font-weight:700">${icon}</span><span>${escapeHTML(message)}</span>`;
    container.appendChild(el);
    setTimeout(() => {
      el.style.animation = 'toastOut 200ms cubic-bezier(0.4, 0, 0.2, 1) forwards';
      setTimeout(() => el.remove(), 200);
    }, duration);
  }

  // ===== Modal 弹窗 =====
  function showModal({ title, desc, confirmText = '确定', cancelText = '取消', onConfirm, onCancel, danger = false }) {
    return new Promise((resolve) => {
      const backdrop = document.createElement('div');
      backdrop.className = 'modal-backdrop';
      backdrop.innerHTML = `
        <div class="modal" role="dialog">
          <div class="modal-title">${escapeHTML(title)}</div>
          <div class="modal-desc">${desc}</div>
          <div class="modal-actions">
            <button class="btn btn-ghost" data-action="cancel">${escapeHTML(cancelText)}</button>
            <button class="btn ${danger ? 'btn-primary' : 'btn-primary'}" data-action="confirm"
                    style="${danger ? 'background:linear-gradient(135deg,#EF4444,#DC2626)' : ''}">
              ${escapeHTML(confirmText)}
            </button>
          </div>
        </div>
      `;
      document.body.appendChild(backdrop);

      function close(result) {
        backdrop.style.animation = 'fadeOut 150ms cubic-bezier(0.4, 0, 0.2, 1) forwards';
        setTimeout(() => {
          backdrop.remove();
          resolve(result);
          if (result && onConfirm) onConfirm();
          if (!result && onCancel) onCancel();
        }, 150);
      }

      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) close(false);
        if (e.target.dataset.action === 'cancel') close(false);
        if (e.target.dataset.action === 'confirm') close(true);
      });
    });
  }

  // ===== HTML 转义 =====
  function escapeHTML(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // ===== 数字格式化 =====
  function formatNumber(n) {
    if (n == null) return '0';
    return Number(n).toLocaleString('zh-CN');
  }

  function formatCNY(n) {
    return '¥' + Number(n).toFixed(2);
  }

  function formatDate(iso) {
    if (!iso) return '-';
    const d = new Date(iso);
    const now = new Date();
    const diff = (now - d) / 1000;
    if (diff < 60) return '刚刚';
    if (diff < 3600) return `${Math.floor(diff / 60)} 分钟前`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} 小时前`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} 天前`;
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }

  // ===== 数字滚动动画 =====
  function animateNumber(el, from, to, duration = 800) {
    if (!el) return;
    const start = performance.now();
    const diff = to - from;
    function step(now) {
      const elapsed = now - start;
      const t = Math.min(elapsed / duration, 1);
      // ease-out-cubic
      const eased = 1 - Math.pow(1 - t, 3);
      const value = Math.floor(from + diff * eased);
      el.textContent = formatNumber(value);
      if (t < 1) requestAnimationFrame(step);
      else el.textContent = formatNumber(to);
    }
    requestAnimationFrame(step);
  }

  // ===== Loading 旋转器 =====
  function spinner(size = 20) {
    return `<span class="spinner" style="width:${size}px;height:${size}px"></span>`;
  }

  // ===== 简易 Markdown 渲染（仅粗体、代码块、列表） =====
  function renderMarkdown(text) {
    if (!text) return '';
    let html = escapeHTML(text);
    // 代码块
    html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
      return `<pre style="background:var(--bg-tertiary);padding:12px 16px;border-radius:8px;overflow-x:auto;margin:8px 0;border:1px solid var(--border-color);font-family:'JetBrains Mono',monospace;font-size:13px;color:var(--text-primary);"><code>${code.trim()}</code></pre>`;
    });
    // 行内代码
    html = html.replace(/`([^`]+)`/g, '<code style="background:var(--bg-tertiary);padding:2px 6px;border-radius:4px;font-family:\'JetBrains Mono\',monospace;font-size:13px;color:var(--color-accent);">$1</code>');
    // 粗体
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong style="color:var(--text-primary);font-weight:700;">$1</strong>');
    // 引用
    html = html.replace(/^&gt; (.+)$/gm, '<blockquote style="border-left:3px solid var(--color-primary);padding-left:12px;color:var(--text-secondary);margin:8px 0;">$1</blockquote>');
    // 列表
    html = html.replace(/^- (.+)$/gm, '<div style="display:flex;gap:8px;align-items:flex-start;margin:4px 0;"><span style="color:var(--color-primary);font-weight:700;">•</span><span>$1</span></div>');
    html = html.replace(/^\d+\. (.+)$/gm, '<div style="display:flex;gap:8px;align-items:flex-start;margin:4px 0;"><span style="color:var(--color-primary);font-weight:700;">→</span><span>$1</span></div>');
    // 换行
    html = html.replace(/\n/g, '<br>');
    return html;
  }

  // ===== 模型图标（首字母 + 颜色块） =====
  function modelAvatar(model) {
    const initial = model.name.charAt(0);
    return `
      <div class="model-avatar" style="
        width:44px;height:44px;border-radius:10px;
        background:linear-gradient(135deg, ${model.logo_color} 0%, ${adjustColor(model.logo_color, -20)} 100%);
        display:flex;align-items:center;justify-content:center;
        color:white;font-weight:800;font-size:18px;
        box-shadow: 0 4px 12px ${hexToRgba(model.logo_color, 0.3)};
        flex-shrink:0;
      ">${escapeHTML(initial)}</div>
    `;
  }

  function adjustColor(hex, amount) {
    const c = hex.replace('#', '');
    const num = parseInt(c, 16);
    let r = (num >> 16) + amount;
    let g = ((num >> 8) & 0x00ff) + amount;
    let b = (num & 0x0000ff) + amount;
    r = Math.max(0, Math.min(255, r));
    g = Math.max(0, Math.min(255, g));
    b = Math.max(0, Math.min(255, b));
    return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
  }

  function hexToRgba(hex, alpha) {
    const c = hex.replace('#', '');
    const num = parseInt(c, 16);
    return `rgba(${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}, ${alpha})`;
  }

  // ===== 路由 =====
  const routes = {};
  let currentRoute = null;
  const routeListeners = [];

  function onRouteChange(fn) {
    routeListeners.push(fn);
  }

  function navigate(page, params = {}) {
    if (currentRoute === page) return;
    currentRoute = page;
    // 隐藏所有页面
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const target = document.getElementById(`page-${page}`);
    if (target) {
      target.classList.add('active');
    }
    // 更新 hash
    const queryStr = Object.keys(params).length
      ? '?' + new URLSearchParams(params).toString()
      : '';
    history.pushState({ page, params }, '', `#${page}${queryStr}`);
    // 更新 nav
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.page === page);
    });
    // 滚动到顶部
    window.scrollTo(0, 0);
    // 触发 listeners
    routeListeners.forEach(fn => {
      try { fn(page, params); } catch (e) { console.error(e); }
    });
  }

  function getCurrentRoute() { return currentRoute; }

  function getRouteFromHash() {
    const hash = location.hash.replace(/^#/, '') || 'home';
    const [page, query] = hash.split('?');
    const params = {};
    if (query) {
      new URLSearchParams(query).forEach((v, k) => params[k] = v);
    }
    return { page, params };
  }

  // ===== 元素创建辅助 =====
  function el(tag, attrs = {}, ...children) {
    const e = document.createElement(tag);
    for (const k in attrs) {
      if (k === 'class') e.className = attrs[k];
      else if (k === 'style' && typeof attrs[k] === 'object') Object.assign(e.style, attrs[k]);
      else if (k.startsWith('on') && typeof attrs[k] === 'function') {
        e.addEventListener(k.slice(2).toLowerCase(), attrs[k]);
      }
      else if (k === 'html') e.innerHTML = attrs[k];
      else e.setAttribute(k, attrs[k]);
    }
    children.flat().forEach(c => {
      if (c == null) return;
      e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return e;
  }

  // 导出
  global.ReservoirUI = {
    showToast, showModal, escapeHTML,
    formatNumber, formatCNY, formatDate,
    animateNumber, spinner, renderMarkdown,
    modelAvatar, hexToRgba, adjustColor,
    onRouteChange, navigate, getCurrentRoute, getRouteFromHash,
    el,
  };
})(window);

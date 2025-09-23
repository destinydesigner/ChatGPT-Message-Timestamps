// Debug mode control
const DEBUG = localStorage.getItem('chatgpt-timestamps-debug') === 'true';
const log = DEBUG ? console.log.bind(console) : () => {};
const error = DEBUG ? console.error.bind(console) : () => {};

log('[ChatGPT Timestamps] Content script loaded', DEBUG ? '(Debug mode ON)' : '');

// 将 pageHook 注入主世界（兼容某些版本不支持 world: MAIN 的场景）
(function inject() {
  try {
    log('[ChatGPT Timestamps] Injecting pageHook.js');
    const s = document.createElement('script');
    s.src = chrome.runtime.getURL('pageHook.js');
    s.onload = () => log('[ChatGPT Timestamps] pageHook.js loaded successfully');
    s.onerror = (e) => error('[ChatGPT Timestamps] Failed to load pageHook.js:', e);
    (document.head || document.documentElement).appendChild(s);
    s.remove();
  } catch (e) {
    error('[ChatGPT Timestamps] Error injecting pageHook.js:', e);
  }
})();

const SELECTORS = [
  '[data-message-id]',
  '[data-testid*="conversation-turn"]',
  'div[class*="group"]',
  '.text-base',
  '[role="presentation"]'
];

const seen = new WeakSet();

function fmt(ts) {
  const d = new Date(ts * 1000);
  const local = d.toLocaleString('zh-CN', { hour12: false });
  const utc = d.toISOString().replace('T',' ').replace('Z',' UTC');
  return { local, utc };
}

function addStamp(el, createTime) {
  if (!el || seen.has(el)) return;
  let bar = el.querySelector('.message-timestamp');
  const { local, utc } = fmt(createTime);

  if (!bar) {
    bar = document.createElement('span');
    bar.className = 'message-timestamp';
    el.insertBefore(bar, el.firstChild);
  }
  bar.textContent = local;
  bar.title = `本地: ${local}\nUTC: ${utc}`;
  seen.add(el);
}

function pickMessageEls() {
  for (const sel of SELECTORS) {
    const list = document.querySelectorAll(sel);
    if (list.length) return { sel, list };
  }
  return { sel: '', list: [] };
}

function paint(mapping) {
  const { list } = pickMessageEls();
  if (!list.length) return;

  list.forEach(el => {
    const id = el.getAttribute('data-message-id');
    const node = id && mapping[id];
    const ct = node?.message?.create_time;
    if (ct) addStamp(el, ct);
  });
}

// 接收主世界发送的数据
window.addEventListener('message', (e) => {
  const data = e.data;
  if (!data || !data.__CHATGPT_TS__) return;
  log('[ChatGPT Timestamps] Received conversation data:', data);
  if (data.type === 'CONV_DATA') {
    paint(data.mapping || {});
  }
});

// 观察 DOM，新增消息时重刷
const mo = new MutationObserver(() => {
  // 轻量 debounce
  if (window.__CHATGPT_TS_T__) cancelAnimationFrame(window.__CHATGPT_TS_T__);
  window.__CHATGPT_TS_T__ = requestAnimationFrame(() => paint(window.__CHATGPT_LATEST_MAP__ || {}));
});
mo.observe(document.documentElement, { childList: true, subtree: true });

// 记住最近一次 mapping，方便增量刷新
window.addEventListener('message', (e) => {
  if (e.data?.__CHATGPT_TS__ && e.data.type === 'CONV_DATA') {
    window.__CHATGPT_LATEST_MAP__ = e.data.mapping;
  }
});

// Debug mode control functions - available globally
window.chatgptTimestampsDebug = {
  enable: () => {
    localStorage.setItem('chatgpt-timestamps-debug', 'true');
    console.log('ChatGPT Timestamps Debug mode ENABLED. Please refresh the page.');
  },
  disable: () => {
    localStorage.setItem('chatgpt-timestamps-debug', 'false');
    console.log('ChatGPT Timestamps Debug mode DISABLED. Please refresh the page.');
  },
  status: () => {
    const enabled = localStorage.getItem('chatgpt-timestamps-debug') === 'true';
    console.log('ChatGPT Timestamps Debug mode:', enabled ? 'ENABLED' : 'DISABLED');
    return enabled;
  }
};

// Expose debug control for popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getDebugStatus') {
    const isEnabled = localStorage.getItem('chatgpt-timestamps-debug') === 'true';
    sendResponse({ debugEnabled: isEnabled });
  } else if (request.action === 'toggleDebug') {
    const currentState = localStorage.getItem('chatgpt-timestamps-debug') === 'true';
    const newState = !currentState;
    localStorage.setItem('chatgpt-timestamps-debug', newState.toString());

    console.log(`%cChatGPT Timestamps Debug mode ${newState ? 'ENABLED' : 'DISABLED'}`,
      `color: ${newState ? '#4CAF50' : '#f44336'}; font-weight: bold;`);

    sendResponse({ debugEnabled: newState, needsRefresh: true });
  }
});

// Show debug help message when debug is enabled
if (DEBUG) {
  console.log('%cChatGPT Timestamps Debug Mode', 'color: #4CAF50; font-weight: bold;');
  console.log('Use chatgptTimestampsDebug.disable() to turn off debug mode or use the extension popup');
} else {
  // Show help message occasionally for normal users
  if (Math.random() < 0.1) { // 10% chance
    console.log('ChatGPT Timestamps: Use chatgptTimestampsDebug.enable() to see debug logs or use the extension popup');
  }
}
(function() {
  // Debug mode control
  const DEBUG = localStorage.getItem('chatgpt-timestamps-debug') === 'true';
  const log = DEBUG ? console.log.bind(console) : () => {};
  const error = DEBUG ? console.error.bind(console) : () => {};

  log('[ChatGPT Timestamps] pageHook.js loaded in main world', DEBUG ? '(Debug mode ON)' : '');

  const ORIG_FETCH = window.fetch;
  if (ORIG_FETCH) {
    window.fetch = async function(...args) {
      const req = args[0];
      const url = typeof req === 'string' ? req : (req?.url || '');
      const res = await ORIG_FETCH.apply(this, args);
      try {
        if (url.includes('/backend-api/conversation')) {
          log('[ChatGPT Timestamps] Intercepted conversation API call:', url);
          const clone = res.clone();
          clone.json().then(data => {
            if (data?.mapping) {
              log('[ChatGPT Timestamps] Posting conversation data with', Object.keys(data.mapping).length, 'messages');
              window.postMessage({ __CHATGPT_TS__: true, type: 'CONV_DATA', mapping: data.mapping }, '*');
            }
          }).catch((e)=>{
            error('[ChatGPT Timestamps] Error parsing conversation data:', e);
          });
        }
      } catch(e) {
        error('[ChatGPT Timestamps] Error in fetch hook:', e);
      }
      return res;
    };
  }

  const ORIG_OPEN = XMLHttpRequest.prototype.open;
  const ORIG_SEND = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open = function(method, url, ...rest) {
    this.__URL__ = url;
    return ORIG_OPEN.apply(this, [method, url, ...rest]);
  };
  XMLHttpRequest.prototype.send = function(...args) {
    this.addEventListener('load', function() {
      try {
        if ((this.__URL__ || '').includes('/backend-api/conversation')) {
          log('[ChatGPT Timestamps] XHR intercepted conversation API call:', this.__URL__);
          const text = this.responseText;
          const data = JSON.parse(text);
          if (data?.mapping) {
            log('[ChatGPT Timestamps] XHR posting conversation data with', Object.keys(data.mapping).length, 'messages');
            window.postMessage({ __CHATGPT_TS__: true, type: 'CONV_DATA', mapping: data.mapping }, '*');
          }
        }
      } catch(e) {
        error('[ChatGPT Timestamps] Error in XHR hook:', e);
      }
    });
    return ORIG_SEND.apply(this, args);
  };
})();
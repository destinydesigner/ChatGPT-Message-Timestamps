(function() {
  const ORIG_FETCH = window.fetch;
  if (ORIG_FETCH) {
    window.fetch = async function(...args) {
      const req = args[0];
      const url = typeof req === 'string' ? req : (req?.url || '');
      const res = await ORIG_FETCH.apply(this, args);
      try {
        if (url.includes('/backend-api/conversation')) {
          const clone = res.clone();
          clone.json().then(data => {
            if (data?.mapping) {
              window.postMessage({ __CHATGPT_TS__: true, type: 'CONV_DATA', mapping: data.mapping }, '*');
            }
          }).catch(()=>{});
        }
      } catch(_) {}
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
          const text = this.responseText;
          const data = JSON.parse(text);
          if (data?.mapping) {
            window.postMessage({ __CHATGPT_TS__: true, type: 'CONV_DATA', mapping: data.mapping }, '*');
          }
        }
      } catch(_) {}
    });
    return ORIG_SEND.apply(this, args);
  };
})();
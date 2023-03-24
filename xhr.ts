// @ts-nocheck
(function () {
  if (window.XMLHttpRequest.version !== 'rcn_xhrhook') {
    function sync(from, to) {
      const fields = [
        'status',
        'readyState',
        'responseText',
        'responseType',
        'responseURL',
        'responseXML',
        'statusText',
        'timeout',
        'response'
      ];
      for (let i = 0; i < fields.length; i++) {
        to[fields[i]] = from[fields[i]];
      }
    }
    const _XHR = window.XMLHttpRequest;
    const XHR = (window.XMLHttpRequest = function XMLHttpRequest() {
      const _xhr = new _XHR();
      const _this = this;

      this.open = function (method, url, async) {
        const queue = XHR.queue;
        this.requestURL = url;

        for (var i = 0; i < queue.length; i++) {
          (function (i) {
            let queueItem = queue[i];
            if (queueItem?.urlRegExp?.test?.(url)) {
              if (!queueItem.method || queueItem.method.toUpperCase() === method.toUpperCase()) {
                _this.send = function (id, idBack, data) {
                  const onSend = queueItem.onSend;
                  onSend?.(_this, data);
                  _xhr.onreadystatechange = function () {
                    sync(_xhr, _this);
                    if (_xhr.readyState === 4) {
                      const onSuccess = queueItem.onSuccess;
                      if (typeof onSuccess === 'function') {
                        try {
                          onSuccess(_this.response, data);
                        } catch (err) {
                          if (err.message === 'ForceExit') {
                            throw err;
                          }
                        }
                      }
                    }
                    _this.onreadystatechange?.();
                  };
                  _xhr.onerror = this.onerror;
                  _xhr.onload = this.onload;
                  _xhr.withCredentials = this.withCredentials;
                  _xhr.send(data);
                }.bind(_this, queueItem.id, queueItem.idBack);
              }
            }
          })(i);
        }
        _xhr.open(method, url, async === undefined ? true : async);
      };

      this.send = function (data) {
        _xhr.onreadystatechange = function () {
          sync(_xhr, _this);
          _this.onreadystatechange?.();
        };
        if (typeof this.onerror !== 'undefined') {
          _xhr.onerror = this.onerror;
        }
        if (typeof this.onload !== 'undefined') {
          _xhr.onload = this.onload;
        }
        if (typeof this.withCredentials !== 'undefined') {
          _xhr.withCredentials = this.withCredentials;
        }
        _xhr.send(data);
      };

      try {
        this.setRequestHeader = _xhr.setRequestHeader.bind(_xhr);
      } catch (error) {}
      try {
        this.overrideMimeType = _xhr.overrideMimeType.bind(_xhr);
      } catch (error) {}
      try {
        this.getResponseHeader = _xhr.getResponseHeader.bind(_xhr);
      } catch (error) {}
      try {
        this.getAllResponseHeaders = _xhr.getAllResponseHeaders.bind(_xhr);
      } catch (error) {}
    });

    if (window.fetch && !window.fetch.version) {
      const oldFetch = fetch;

      window.fetch = async (...args) => {
        const fetchResult = await oldFetch(...args);
        if (typeof window.fetchWatcher === 'function') {
          // https://stackoverflow.com/questions/53511974/javascript-fetch-failed-to-execute-json-on-response-body-stream-is-locked
          window.fetchWatcher(args, fetchResult.clone());
        }

        const queue = window.XMLHttpRequest.queue || [];

        // https://developer.mozilla.org/zh-CN/docs/Web/API/Fetch_API/Using_Fetch
        const target = args.find((item) => item?.method);
        const method = target ? target.method : 'GET';

        for (let i = 0; i < queue.length; i++) {
          const queueItem = queue[i];

          if (queueItem?.urlRegExp?.test?.(fetchResult.url || target.url)) {
            if (!queueItem.method || queueItem.method.toUpperCase() === method.toUpperCase()) {
              const onSuccess = queueItem.onSuccess;
              if (typeof onSuccess === 'function') {
                try {
                  const data = await fetchResult.clone().json();
                  //   onSuccess(data, fetchResult.clone());
                  const [, params] = args;
                  onSuccess(data, params?.body ?? '');
                } catch (err) {
                  console.error(err);
                }
              }
            }
          }
        }

        return fetchResult;
      };

      window.fetch.version = 'rcn_xhrhook';
    }
    window.XMLHttpRequest.constructor = _XHR;
    XHR.version = 'rcn_xhrhook';
    XHR.queue = [];
  }
})();


/* 使用：
window.XMLHttpRequest.queue.push({
  urlRegExp: '',
  success: function () {}
});
*/

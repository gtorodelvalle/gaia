var utils = window.utils || {};

if (typeof utils.config === 'undefined') {
  (function() {
    var config = utils.config = {};
    var loading = {};
    var loaded = {};
    var pendingRequests = {};

    config.load = function(resource) {
      var outReq = new LoadRequest();

      var data = loaded[resource];
      if (data) {
        window.console.error('xxxxxxxxxxxxxxxxxx');
        window.console.error('CACHE: 'pendingRequests + resource);
        window.console.error('xxxxxxxxxxxxxxxxxx');
        window.setTimeout(function() {
          window.console.error('HERE 1');
          outReq.completed(data);
        },0);
      }
      else {
        window.console.error('xxxxxxxxxxxxxxxxxx');
        window.console.error('NOT IN CACHE: ' + resource);
        window.console.error('xxxxxxxxxxxxxxxxxx');
        var requests = pendingRequests[resource];
        if (!Array.isArray(requests)) {
          pendingRequests[resource] = requests = [];
        }
        requests.push(outReq);
        var isLoading = loading[resource];
        if (!isLoading) {
          loading[resource] = true;
          window.setTimeout(function do_load() {
            window.console.error('xxxxxxxxxxxxxxxxxx');
            window.console.error('SENDING XHR: ' + resource);
            window.console.error('xxxxxxxxxxxxxxxxxx');
            var xhr = new XMLHttpRequest();
            xhr.overrideMimeType('application/json');
            xhr.open('GET', resource, true);

            xhr.onreadystatechange = function() {
              window.console.error('xxxxxxxxxxxxxxxxxx');
              window.console.error('READY XHR: ' + xhr.readyState + ' - ' +
                                   xhr.status);
              window.console.error('xxxxxxxxxxxxxxxxxx');
              // We will get a 0 status if the app is in app://
              if (xhr.readyState === 4 && (xhr.status === 200 ||
                                           xhr.status === 0)) {

                var response = xhr.responseText;
                var configuration = JSON.parse(response);
                loaded[resource] = configuration;
                delete loading[resource];
                // Notifying all pending requests
                requests.forEach(function(aRequest) {
                  aRequest.completed(configuration);
                });
                delete pendingRequests[resource];
              }
              else if (xhr.readyState === 4) {
                requests.forEach(function(aRequest) {
                  aRequest.failed(xhr.status);
                });
                delete pendingRequests[resource];
              }
            }; // onreadystatechange

            xhr.send(null);

          },0);
        }
      }
      return outReq;
    };

    function LoadRequest() {
      this.completed = function(configData) {
        if (typeof this.onload === 'function') {
          this.onload(configData);
        }
      };

      this.failed = function(code) {
        if (typeof this.onerror === 'function') {
          this.onerror(code);
        }
      };
    }
  })();
}

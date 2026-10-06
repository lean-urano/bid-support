// Reports this page's location (pathname+search+hash) to the DEV FACTORY dashboard that frames it,
// so the Preview address bar follows in-page navigation. Load with <script src="/preview-bridge.js"></script>.
// The dashboard only trusts messages whose source is its own Preview iframe, and the payload is a path only.
// It also answers the dashboard's per-load ping with `ack`, so the dashboard can tell a page that has the bridge
// from one that does not, whatever order the frame's load and the reports arrive in.
(function () {
  var TYPE = "df-preview-location";
  var PING = "df-preview-ping";
  if (window.parent === window) return;
  var last = null;
  function report(ack) {
    var loc = window.location;
    var url = loc.pathname + loc.search + loc.hash;
    if (typeof ack !== "number" && url === last) return;
    last = url;
    var message = { type: TYPE, url: url };
    if (typeof ack === "number") message.ack = ack;
    window.parent.postMessage(message, "*");
  }
  ["pushState", "replaceState"].forEach(function (name) {
    var original = window.history[name];
    window.history[name] = function () {
      var result = original.apply(this, arguments);
      report();
      return result;
    };
  });
  window.addEventListener("popstate", report);
  window.addEventListener("hashchange", report);
  window.addEventListener("message", function (event) {
    var data = event.data;
    if (event.source === window.parent && data && data.type === PING && typeof data.nonce === "number") report(data.nonce);
  });
  report();
})();

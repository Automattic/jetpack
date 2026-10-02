// packages/priority-queue/src/request-idle-callback.ts
import "requestidlecallback";
function createRequestIdleCallback() {
  if (typeof window === "undefined") {
    return (callback) => {
      setTimeout(() => callback(Date.now()), 0);
    };
  }
  return window.requestIdleCallback;
}
var request_idle_callback_default = createRequestIdleCallback();
export {
  createRequestIdleCallback,
  request_idle_callback_default as default
};
//# sourceMappingURL=request-idle-callback.mjs.map

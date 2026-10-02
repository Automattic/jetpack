// packages/data/src/promise-middleware.ts
import isPromise from "is-promise";
var promiseMiddleware = () => (next) => (action) => {
  if (isPromise(action)) {
    return action.then((resolvedAction) => {
      if (resolvedAction) {
        return next(resolvedAction);
      }
      return void 0;
    });
  }
  return next(action);
};
var promise_middleware_default = promiseMiddleware;
export {
  promise_middleware_default as default
};
//# sourceMappingURL=promise-middleware.mjs.map

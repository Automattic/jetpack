// packages/redux-routine/src/index.ts
import isGenerator from "./is-generator.mjs";
import createRuntime from "./runtime.mjs";
function createMiddleware(controls = {}) {
  return (store) => {
    const runtime = createRuntime(controls, store.dispatch);
    return (next) => (action) => {
      if (!isGenerator(action)) {
        return next(action);
      }
      return runtime(action);
    };
  };
}
export {
  createMiddleware as default
};
//# sourceMappingURL=index.mjs.map

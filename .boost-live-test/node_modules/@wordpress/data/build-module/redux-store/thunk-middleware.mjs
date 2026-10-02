// packages/data/src/redux-store/thunk-middleware.ts
function createThunkMiddleware(args) {
  return () => (next) => (action) => {
    if (typeof action === "function") {
      return action(args);
    }
    return next(action);
  };
}
export {
  createThunkMiddleware as default
};
//# sourceMappingURL=thunk-middleware.mjs.map

// packages/data/src/dispatch.ts
import defaultRegistry from "./default-registry.mjs";
function dispatch(storeNameOrDescriptor) {
  return defaultRegistry.dispatch(
    storeNameOrDescriptor
  );
}
export {
  dispatch
};
//# sourceMappingURL=dispatch.mjs.map

// packages/data/src/controls.ts
import { createRegistryControl } from "./factory.mjs";
var SELECT = "@@data/SELECT";
var RESOLVE_SELECT = "@@data/RESOLVE_SELECT";
var DISPATCH = "@@data/DISPATCH";
function isStoreDescriptor(object) {
  return object !== null && typeof object === "object";
}
function select(storeNameOrDescriptor, selectorName, ...args) {
  return {
    type: SELECT,
    storeKey: isStoreDescriptor(storeNameOrDescriptor) ? storeNameOrDescriptor.name : storeNameOrDescriptor,
    selectorName,
    args
  };
}
function resolveSelect(storeNameOrDescriptor, selectorName, ...args) {
  return {
    type: RESOLVE_SELECT,
    storeKey: isStoreDescriptor(storeNameOrDescriptor) ? storeNameOrDescriptor.name : storeNameOrDescriptor,
    selectorName,
    args
  };
}
function dispatch(storeNameOrDescriptor, actionName, ...args) {
  return {
    type: DISPATCH,
    storeKey: isStoreDescriptor(storeNameOrDescriptor) ? storeNameOrDescriptor.name : storeNameOrDescriptor,
    actionName,
    args
  };
}
var controls = { select, resolveSelect, dispatch };
var builtinControls = {
  [SELECT]: createRegistryControl(
    (registry) => ({ storeKey, selectorName, args }) => registry.select(storeKey)[selectorName](...args)
  ),
  [RESOLVE_SELECT]: createRegistryControl(
    (registry) => ({ storeKey, selectorName, args }) => {
      const selector = registry.select(storeKey)[selectorName];
      const method = selector.hasResolver ? "resolveSelect" : "select";
      return registry[method](storeKey)[selectorName](
        ...args
      );
    }
  ),
  [DISPATCH]: createRegistryControl(
    (registry) => ({ storeKey, actionName, args }) => registry.dispatch(storeKey)[actionName](...args)
  )
};
export {
  builtinControls,
  controls
};
//# sourceMappingURL=controls.mjs.map

"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// packages/data/src/controls.ts
var controls_exports = {};
__export(controls_exports, {
  builtinControls: () => builtinControls,
  controls: () => controls
});
module.exports = __toCommonJS(controls_exports);
var import_factory = require("./factory.cjs");
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
  [SELECT]: (0, import_factory.createRegistryControl)(
    (registry) => ({ storeKey, selectorName, args }) => registry.select(storeKey)[selectorName](...args)
  ),
  [RESOLVE_SELECT]: (0, import_factory.createRegistryControl)(
    (registry) => ({ storeKey, selectorName, args }) => {
      const selector = registry.select(storeKey)[selectorName];
      const method = selector.hasResolver ? "resolveSelect" : "select";
      return registry[method](storeKey)[selectorName](
        ...args
      );
    }
  ),
  [DISPATCH]: (0, import_factory.createRegistryControl)(
    (registry) => ({ storeKey, actionName, args }) => registry.dispatch(storeKey)[actionName](...args)
  )
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  builtinControls,
  controls
});
//# sourceMappingURL=controls.cjs.map

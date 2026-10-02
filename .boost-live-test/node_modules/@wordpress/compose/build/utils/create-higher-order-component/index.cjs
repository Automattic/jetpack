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

// packages/compose/src/utils/create-higher-order-component/index.ts
var create_higher_order_component_exports = {};
__export(create_higher_order_component_exports, {
  createHigherOrderComponent: () => createHigherOrderComponent
});
module.exports = __toCommonJS(create_higher_order_component_exports);
var import_change_case = require("change-case");
function createHigherOrderComponent(mapComponent, modifierName) {
  return (Inner) => {
    const Outer = mapComponent(Inner);
    Outer.displayName = hocName(modifierName, Inner);
    return Outer;
  };
}
var hocName = (name, Inner) => {
  const inner = Inner.displayName || Inner.name || "Component";
  const outer = (0, import_change_case.pascalCase)(name ?? "");
  return `${outer}(${inner})`;
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  createHigherOrderComponent
});
//# sourceMappingURL=index.cjs.map

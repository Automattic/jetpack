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

// packages/components/src/v-stack/hook.ts
var hook_exports = {};
__export(hook_exports, {
  useVStack: () => useVStack
});
module.exports = __toCommonJS(hook_exports);
var import_context = require("../context/index.cjs");
var import_h_stack = require("../h-stack/index.cjs");
function useVStack(props) {
  const {
    expanded = false,
    alignment = "stretch",
    ...otherProps
  } = (0, import_context.useContextSystem)(props, "VStack");
  const hStackProps = (0, import_h_stack.useHStack)({
    direction: "column",
    expanded,
    alignment,
    ...otherProps
  });
  return hStackProps;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  useVStack
});
//# sourceMappingURL=hook.cjs.map

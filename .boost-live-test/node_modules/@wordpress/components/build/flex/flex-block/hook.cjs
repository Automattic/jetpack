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

// packages/components/src/flex/flex-block/hook.ts
var hook_exports = {};
__export(hook_exports, {
  useFlexBlock: () => useFlexBlock
});
module.exports = __toCommonJS(hook_exports);
var import_context = require("../../context/index.cjs");
var import_flex_item = require("../flex-item/index.cjs");
function useFlexBlock(props) {
  const otherProps = (0, import_context.useContextSystem)(props, "FlexBlock");
  const flexItemProps = (0, import_flex_item.useFlexItem)({
    isBlock: true,
    ...otherProps
  });
  return flexItemProps;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  useFlexBlock
});
//# sourceMappingURL=hook.cjs.map

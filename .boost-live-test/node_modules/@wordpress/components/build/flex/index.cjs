"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// packages/components/src/flex/index.ts
var flex_exports = {};
__export(flex_exports, {
  Flex: () => import_flex.default,
  FlexBlock: () => import_flex_block.default,
  FlexItem: () => import_flex_item.default,
  useFlex: () => import_flex.useFlex,
  useFlexBlock: () => import_flex_block.useFlexBlock,
  useFlexItem: () => import_flex_item.useFlexItem
});
module.exports = __toCommonJS(flex_exports);
var import_flex = __toESM(require("./flex/index.cjs"));
var import_flex_item = __toESM(require("./flex-item/index.cjs"));
var import_flex_block = __toESM(require("./flex-block/index.cjs"));
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Flex,
  FlexBlock,
  FlexItem,
  useFlex,
  useFlexBlock,
  useFlexItem
});
//# sourceMappingURL=index.cjs.map

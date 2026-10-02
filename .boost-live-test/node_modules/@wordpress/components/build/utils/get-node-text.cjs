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

// packages/components/src/utils/get-node-text.ts
var get_node_text_exports = {};
__export(get_node_text_exports, {
  default: () => get_node_text_default
});
module.exports = __toCommonJS(get_node_text_exports);
var getNodeText = (node) => {
  if (node === null) {
    return "";
  }
  switch (typeof node) {
    case "string":
    case "number":
      return node.toString();
    case "object": {
      if (node instanceof Array) {
        return node.map(getNodeText).join("");
      }
      if ("props" in node) {
        return getNodeText(node.props.children);
      }
      return "";
    }
    default:
      return "";
  }
};
var get_node_text_default = getNodeText;
//# sourceMappingURL=get-node-text.cjs.map

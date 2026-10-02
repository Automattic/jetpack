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

// packages/rich-text/src/get-text-content.js
var get_text_content_exports = {};
__export(get_text_content_exports, {
  getTextContent: () => getTextContent
});
module.exports = __toCommonJS(get_text_content_exports);
var import_special_characters = require("./special-characters.cjs");
function getTextContent({ text }) {
  return text.replace(import_special_characters.OBJECT_REPLACEMENT_CHARACTER, "");
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  getTextContent
});
//# sourceMappingURL=get-text-content.cjs.map

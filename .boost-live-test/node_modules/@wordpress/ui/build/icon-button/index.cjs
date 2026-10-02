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

// packages/ui/src/icon-button/index.ts
var icon_button_exports = {};
__export(icon_button_exports, {
  IconButton: () => import_icon_button.IconButton
});
module.exports = __toCommonJS(icon_button_exports);
var import_icon_button = require("./icon-button.cjs");
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  IconButton
});
//# sourceMappingURL=index.cjs.map

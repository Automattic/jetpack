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

// packages/rich-text/src/unregister-format-type.js
var unregister_format_type_exports = {};
__export(unregister_format_type_exports, {
  unregisterFormatType: () => unregisterFormatType
});
module.exports = __toCommonJS(unregister_format_type_exports);
var import_data = require("@wordpress/data");
var import_store = require("./store/index.cjs");
function unregisterFormatType(name) {
  const oldFormat = (0, import_data.select)(import_store.store).getFormatType(name);
  if (!oldFormat) {
    window.console.error(`Format ${name} is not registered.`);
    return;
  }
  (0, import_data.dispatch)(import_store.store).removeFormatTypes(name);
  return oldFormat;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  unregisterFormatType
});
//# sourceMappingURL=unregister-format-type.cjs.map

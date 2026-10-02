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

// packages/rich-text/src/store/actions.js
var actions_exports = {};
__export(actions_exports, {
  addFormatTypes: () => addFormatTypes,
  removeFormatTypes: () => removeFormatTypes
});
module.exports = __toCommonJS(actions_exports);
function addFormatTypes(formatTypes) {
  return {
    type: "ADD_FORMAT_TYPES",
    formatTypes: Array.isArray(formatTypes) ? formatTypes : [formatTypes]
  };
}
function removeFormatTypes(names) {
  return {
    type: "REMOVE_FORMAT_TYPES",
    names: Array.isArray(names) ? names : [names]
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  addFormatTypes,
  removeFormatTypes
});
//# sourceMappingURL=actions.cjs.map

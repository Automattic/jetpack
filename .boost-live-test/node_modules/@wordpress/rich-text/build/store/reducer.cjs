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

// packages/rich-text/src/store/reducer.js
var reducer_exports = {};
__export(reducer_exports, {
  default: () => reducer_default,
  formatTypes: () => formatTypes
});
module.exports = __toCommonJS(reducer_exports);
var import_data = require("@wordpress/data");
function formatTypes(state = {}, action) {
  switch (action.type) {
    case "ADD_FORMAT_TYPES":
      return {
        ...state,
        // Key format types by their name.
        ...action.formatTypes.reduce(
          (newFormatTypes, type) => ({
            ...newFormatTypes,
            [type.name]: type
          }),
          {}
        )
      };
    case "REMOVE_FORMAT_TYPES":
      return Object.fromEntries(
        Object.entries(state).filter(
          ([key]) => !action.names.includes(key)
        )
      );
  }
  return state;
}
var reducer_default = (0, import_data.combineReducers)({ formatTypes });
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  formatTypes
});
//# sourceMappingURL=reducer.cjs.map

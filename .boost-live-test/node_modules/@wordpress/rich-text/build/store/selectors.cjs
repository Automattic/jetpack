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

// packages/rich-text/src/store/selectors.js
var selectors_exports = {};
__export(selectors_exports, {
  getFormatType: () => getFormatType,
  getFormatTypeForBareElement: () => getFormatTypeForBareElement,
  getFormatTypeForClassName: () => getFormatTypeForClassName,
  getFormatTypes: () => getFormatTypes
});
module.exports = __toCommonJS(selectors_exports);
var import_data = require("@wordpress/data");
var getFormatTypes = (0, import_data.createSelector)(
  (state) => Object.values(state.formatTypes),
  (state) => [state.formatTypes]
);
function getFormatType(state, name) {
  return state.formatTypes[name];
}
function getFormatTypeForBareElement(state, bareElementTagName) {
  const formatTypes = getFormatTypes(state);
  return formatTypes.find(({ className, tagName }) => {
    return className === null && bareElementTagName === tagName;
  }) || formatTypes.find(({ className, tagName }) => {
    return className === null && "*" === tagName;
  });
}
function getFormatTypeForClassName(state, elementClassName) {
  return getFormatTypes(state).find(({ className }) => {
    if (className === null) {
      return false;
    }
    return ` ${elementClassName} `.indexOf(` ${className} `) >= 0;
  });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  getFormatType,
  getFormatTypeForBareElement,
  getFormatTypeForClassName,
  getFormatTypes
});
//# sourceMappingURL=selectors.cjs.map

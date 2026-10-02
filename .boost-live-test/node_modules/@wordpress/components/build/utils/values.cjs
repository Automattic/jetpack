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

// packages/components/src/utils/values.js
var values_exports = {};
__export(values_exports, {
  ensureNumber: () => ensureNumber,
  getDefinedValue: () => getDefinedValue,
  isValueDefined: () => isValueDefined,
  isValueEmpty: () => isValueEmpty,
  stringToNumber: () => stringToNumber
});
module.exports = __toCommonJS(values_exports);
function isValueDefined(value) {
  return value !== void 0 && value !== null;
}
function isValueEmpty(value) {
  const isEmptyString = value === "";
  return !isValueDefined(value) || isEmptyString;
}
function getDefinedValue(values = [], fallbackValue) {
  return values.find(isValueDefined) ?? fallbackValue;
}
var stringToNumber = (value) => {
  return parseFloat(value);
};
var ensureNumber = (value) => {
  return typeof value === "string" ? stringToNumber(value) : value;
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ensureNumber,
  getDefinedValue,
  isValueDefined,
  isValueEmpty,
  stringToNumber
});
//# sourceMappingURL=values.cjs.map

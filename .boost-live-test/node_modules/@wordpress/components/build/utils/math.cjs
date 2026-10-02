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

// packages/components/src/utils/math.js
var math_exports = {};
__export(math_exports, {
  add: () => add,
  clamp: () => clamp,
  ensureValidStep: () => ensureValidStep,
  getNumber: () => getNumber,
  subtract: () => subtract
});
module.exports = __toCommonJS(math_exports);
function getNumber(value) {
  const number = Number(value);
  return isNaN(number) ? 0 : number;
}
function add(...args) {
  return args.reduce(
    /** @type {(sum:number, arg: number|string) => number} */
    (sum, arg) => sum + getNumber(arg),
    0
  );
}
function subtract(...args) {
  return args.reduce(
    /** @type {(diff:number, arg: number|string, index:number) => number} */
    (diff, arg, index) => {
      const value = getNumber(arg);
      return index === 0 ? value : diff - value;
    },
    0
  );
}
function getPrecision(value) {
  const split = (value + "").split(".");
  return split[1] !== void 0 ? split[1].length : 0;
}
function clamp(value, min, max) {
  const baseValue = getNumber(value);
  return Math.max(min, Math.min(baseValue, max));
}
function ensureValidStep(value, min, step) {
  const baseValue = getNumber(value);
  const minValue = getNumber(min);
  const stepValue = getNumber(step);
  const precision = Math.max(getPrecision(step), getPrecision(min));
  const tare = minValue % stepValue ? minValue : 0;
  const rounded = Math.round((baseValue - tare) / stepValue) * stepValue;
  const fromMin = rounded + tare;
  return precision ? getNumber(fromMin.toFixed(precision)) : fromMin;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  add,
  clamp,
  ensureValidStep,
  getNumber,
  subtract
});
//# sourceMappingURL=math.cjs.map

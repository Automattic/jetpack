// packages/components/src/utils/math.js
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
export {
  add,
  clamp,
  ensureValidStep,
  getNumber,
  subtract
};
//# sourceMappingURL=math.mjs.map

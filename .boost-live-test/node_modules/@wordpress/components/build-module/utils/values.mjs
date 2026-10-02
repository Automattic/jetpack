// packages/components/src/utils/values.js
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
export {
  ensureNumber,
  getDefinedValue,
  isValueDefined,
  isValueEmpty,
  stringToNumber
};
//# sourceMappingURL=values.mjs.map

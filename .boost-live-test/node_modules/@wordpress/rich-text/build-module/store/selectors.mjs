// packages/rich-text/src/store/selectors.js
import { createSelector } from "@wordpress/data";
var getFormatTypes = createSelector(
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
export {
  getFormatType,
  getFormatTypeForBareElement,
  getFormatTypeForClassName,
  getFormatTypes
};
//# sourceMappingURL=selectors.mjs.map

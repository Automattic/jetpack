// packages/rich-text/src/store/actions.js
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
export {
  addFormatTypes,
  removeFormatTypes
};
//# sourceMappingURL=actions.mjs.map

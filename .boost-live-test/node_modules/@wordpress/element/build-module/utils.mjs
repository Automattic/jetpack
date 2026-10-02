// packages/element/src/utils.ts
var isEmptyElement = (element) => {
  if (typeof element === "number") {
    return false;
  }
  if (typeof element?.valueOf() === "string" || Array.isArray(element)) {
    return !element.length;
  }
  return !element;
};
export {
  isEmptyElement
};
//# sourceMappingURL=utils.mjs.map

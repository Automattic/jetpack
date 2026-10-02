// packages/dom/src/dom/is-empty.js
function isEmpty(element) {
  switch (element.nodeType) {
    case element.TEXT_NODE:
      return /^[ \f\n\r\t\v\u00a0]*$/.test(element.nodeValue || "");
    case element.ELEMENT_NODE:
      if (element.hasAttributes()) {
        return false;
      } else if (!element.hasChildNodes()) {
        return true;
      }
      return (
        /** @type {Element[]} */
        Array.from(element.childNodes).every(isEmpty)
      );
    default:
      return true;
  }
}
export {
  isEmpty as default
};
//# sourceMappingURL=is-empty.mjs.map

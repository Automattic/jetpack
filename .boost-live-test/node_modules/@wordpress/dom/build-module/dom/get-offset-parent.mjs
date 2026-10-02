// packages/dom/src/dom/get-offset-parent.js
import getComputedStyle from "./get-computed-style.mjs";
function getOffsetParent(node) {
  let closestElement;
  while (closestElement = /** @type {Node} */
  node.parentNode) {
    if (closestElement.nodeType === closestElement.ELEMENT_NODE) {
      break;
    }
  }
  if (!closestElement) {
    return null;
  }
  if (getComputedStyle(
    /** @type {Element} */
    closestElement
  ).position !== "static") {
    return closestElement;
  }
  return (
    /** @type {Node & { offsetParent: Node }} */
    closestElement.offsetParent
  );
}
export {
  getOffsetParent as default
};
//# sourceMappingURL=get-offset-parent.mjs.map

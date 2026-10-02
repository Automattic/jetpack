// packages/dom/src/dom/insert-after.js
import { assertIsDefined } from "../utils/assert-is-defined.mjs";
function insertAfter(newNode, referenceNode) {
  assertIsDefined(referenceNode.parentNode, "referenceNode.parentNode");
  referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
}
export {
  insertAfter as default
};
//# sourceMappingURL=insert-after.mjs.map

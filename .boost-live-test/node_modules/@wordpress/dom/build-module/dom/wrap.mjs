// packages/dom/src/dom/wrap.js
import { assertIsDefined } from "../utils/assert-is-defined.mjs";
function wrap(newNode, referenceNode) {
  assertIsDefined(referenceNode.parentNode, "referenceNode.parentNode");
  referenceNode.parentNode.insertBefore(newNode, referenceNode);
  newNode.appendChild(referenceNode);
}
export {
  wrap as default
};
//# sourceMappingURL=wrap.mjs.map

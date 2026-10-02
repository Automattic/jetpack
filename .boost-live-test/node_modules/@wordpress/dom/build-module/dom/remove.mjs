// packages/dom/src/dom/remove.js
import { assertIsDefined } from "../utils/assert-is-defined.mjs";
function remove(node) {
  assertIsDefined(node.parentNode, "node.parentNode");
  node.parentNode.removeChild(node);
}
export {
  remove as default
};
//# sourceMappingURL=remove.mjs.map

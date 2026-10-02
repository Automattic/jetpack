// packages/dom/src/dom/unwrap.js
import { assertIsDefined } from "../utils/assert-is-defined.mjs";
function unwrap(node) {
  const parent = node.parentNode;
  assertIsDefined(parent, "node.parentNode");
  while (node.firstChild) {
    parent.insertBefore(node.firstChild, node);
  }
  parent.removeChild(node);
}
export {
  unwrap as default
};
//# sourceMappingURL=unwrap.mjs.map

// packages/dom/src/dom/replace.js
import { assertIsDefined } from "../utils/assert-is-defined.mjs";
import insertAfter from "./insert-after.mjs";
import remove from "./remove.mjs";
function replace(processedNode, newNode) {
  assertIsDefined(processedNode.parentNode, "processedNode.parentNode");
  insertAfter(newNode, processedNode.parentNode);
  remove(processedNode);
}
export {
  replace as default
};
//# sourceMappingURL=replace.mjs.map

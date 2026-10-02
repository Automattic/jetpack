// packages/dom/src/dom/replace-tag.js
import { assertIsDefined } from "../utils/assert-is-defined.mjs";
function replaceTag(node, tagName) {
  const newNode = node.ownerDocument.createElement(tagName);
  while (node.firstChild) {
    newNode.appendChild(node.firstChild);
  }
  assertIsDefined(node.parentNode, "node.parentNode");
  node.parentNode.replaceChild(newNode, node);
  return newNode;
}
export {
  replaceTag as default
};
//# sourceMappingURL=replace-tag.mjs.map

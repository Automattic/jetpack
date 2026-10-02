// packages/dom/src/dom/get-computed-style.js
import { assertIsDefined } from "../utils/assert-is-defined.mjs";
function getComputedStyle(element) {
  assertIsDefined(
    element.ownerDocument.defaultView,
    "element.ownerDocument.defaultView"
  );
  return element.ownerDocument.defaultView.getComputedStyle(element);
}
export {
  getComputedStyle as default
};
//# sourceMappingURL=get-computed-style.mjs.map

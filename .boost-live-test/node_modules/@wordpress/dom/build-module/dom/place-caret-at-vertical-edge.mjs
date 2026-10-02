// packages/dom/src/dom/place-caret-at-vertical-edge.js
import placeCaretAtEdge from "./place-caret-at-edge.mjs";
function placeCaretAtVerticalEdge(container, isReverse, rect) {
  return placeCaretAtEdge(container, isReverse, rect?.left);
}
export {
  placeCaretAtVerticalEdge as default
};
//# sourceMappingURL=place-caret-at-vertical-edge.mjs.map

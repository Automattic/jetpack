// packages/dom/src/dom/is-entirely-selected.js
import { assertIsDefined } from "../utils/assert-is-defined.mjs";
import isInputOrTextArea from "./is-input-or-text-area.mjs";
var ZWNBSP = "\uFEFF";
function isEntirelySelected(element) {
  if (isInputOrTextArea(element)) {
    return element.selectionStart === 0 && element.value.length === element.selectionEnd;
  }
  if (!element.isContentEditable) {
    return true;
  }
  const text = element.textContent || "";
  if (text === "" || text === ZWNBSP) {
    return true;
  }
  const { ownerDocument } = element;
  const { defaultView } = ownerDocument;
  assertIsDefined(defaultView, "defaultView");
  const selection = defaultView.getSelection();
  assertIsDefined(selection, "selection");
  const range = selection.rangeCount ? selection.getRangeAt(0) : null;
  if (!range) {
    return true;
  }
  const { startContainer, endContainer, startOffset, endOffset } = range;
  if (startContainer === element && endContainer === element && startOffset === 0 && endOffset === element.childNodes.length) {
    return true;
  }
  const lastChild = element.lastChild;
  assertIsDefined(lastChild, "lastChild");
  const endContainerContentLength = endContainer.nodeType === endContainer.TEXT_NODE ? (
    /** @type {Text} */
    endContainer.data.length
  ) : endContainer.childNodes.length;
  return isDeepChild(startContainer, element, "firstChild") && isDeepChild(endContainer, element, "lastChild") && startOffset === 0 && endOffset === endContainerContentLength;
}
function isDeepChild(query, container, propName) {
  let candidate = container;
  do {
    if (query === candidate) {
      return true;
    }
    candidate = candidate[propName];
    while (candidate && candidate.nodeType === candidate.TEXT_NODE && candidate.nodeValue === "") {
      candidate = candidate[propName === "lastChild" ? "previousSibling" : "nextSibling"];
    }
  } while (candidate);
  return false;
}
export {
  isEntirelySelected as default
};
//# sourceMappingURL=is-entirely-selected.mjs.map

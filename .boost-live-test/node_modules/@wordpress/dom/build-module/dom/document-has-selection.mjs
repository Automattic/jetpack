// packages/dom/src/dom/document-has-selection.js
import isTextField from "./is-text-field.mjs";
import isHTMLInputElement from "./is-html-input-element.mjs";
import documentHasTextSelection from "./document-has-text-selection.mjs";
function documentHasSelection(doc) {
  return !!doc.activeElement && (isHTMLInputElement(doc.activeElement) || isTextField(doc.activeElement) || documentHasTextSelection(doc));
}
export {
  documentHasSelection as default
};
//# sourceMappingURL=document-has-selection.mjs.map

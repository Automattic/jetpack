// packages/dom/src/dom/document-has-uncollapsed-selection.js
import documentHasTextSelection from "./document-has-text-selection.mjs";
import inputFieldHasUncollapsedSelection from "./input-field-has-uncollapsed-selection.mjs";
function documentHasUncollapsedSelection(doc) {
  return documentHasTextSelection(doc) || !!doc.activeElement && inputFieldHasUncollapsedSelection(doc.activeElement);
}
export {
  documentHasUncollapsedSelection as default
};
//# sourceMappingURL=document-has-uncollapsed-selection.mjs.map

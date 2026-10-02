// packages/dom/src/dom/is-form-element.js
import isInputOrTextArea from "./is-input-or-text-area.mjs";
function isFormElement(element) {
  if (!element) {
    return false;
  }
  const { tagName } = element;
  const checkForInputTextarea = isInputOrTextArea(element);
  return checkForInputTextarea || tagName === "BUTTON" || tagName === "SELECT";
}
export {
  isFormElement as default
};
//# sourceMappingURL=is-form-element.mjs.map

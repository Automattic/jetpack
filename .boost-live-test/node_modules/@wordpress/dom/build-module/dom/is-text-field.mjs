// packages/dom/src/dom/is-text-field.js
import isHTMLInputElement from "./is-html-input-element.mjs";
function isTextField(node) {
  const nonTextInputs = [
    "button",
    "checkbox",
    "hidden",
    "file",
    "radio",
    "image",
    "range",
    "reset",
    "submit",
    "number",
    "email",
    "time"
  ];
  return isHTMLInputElement(node) && node.type && !nonTextInputs.includes(node.type) || node.nodeName === "TEXTAREA" || /** @type {HTMLElement} */
  node.contentEditable === "true";
}
export {
  isTextField as default
};
//# sourceMappingURL=is-text-field.mjs.map

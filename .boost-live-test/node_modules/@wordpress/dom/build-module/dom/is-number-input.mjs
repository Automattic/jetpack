// packages/dom/src/dom/is-number-input.js
import deprecated from "@wordpress/deprecated";
import isHTMLInputElement from "./is-html-input-element.mjs";
function isNumberInput(node) {
  deprecated("wp.dom.isNumberInput", {
    since: "6.1",
    version: "6.5"
  });
  return isHTMLInputElement(node) && node.type === "number" && !isNaN(node.valueAsNumber);
}
export {
  isNumberInput as default
};
//# sourceMappingURL=is-number-input.mjs.map

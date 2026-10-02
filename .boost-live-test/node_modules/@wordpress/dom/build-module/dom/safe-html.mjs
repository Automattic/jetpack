// packages/dom/src/dom/safe-html.js
import remove from "./remove.mjs";
function safeHTML(html) {
  const { body } = document.implementation.createHTMLDocument("");
  body.innerHTML = html;
  const elements = body.getElementsByTagName("*");
  let elementIndex = elements.length;
  while (elementIndex--) {
    const element = elements[elementIndex];
    if (element.tagName === "SCRIPT") {
      remove(element);
    } else {
      let attributeIndex = element.attributes.length;
      while (attributeIndex--) {
        const { name: key } = element.attributes[attributeIndex];
        if (key.startsWith("on")) {
          element.removeAttribute(key);
        }
      }
    }
  }
  return body.innerHTML;
}
export {
  safeHTML as default
};
//# sourceMappingURL=safe-html.mjs.map

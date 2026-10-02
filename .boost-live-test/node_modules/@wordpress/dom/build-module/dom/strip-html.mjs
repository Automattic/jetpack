// packages/dom/src/dom/strip-html.js
import safeHTML from "./safe-html.mjs";
function stripHTML(html) {
  html = safeHTML(html);
  const doc = document.implementation.createHTMLDocument("");
  doc.body.innerHTML = html;
  return doc.body.textContent || "";
}
export {
  stripHTML as default
};
//# sourceMappingURL=strip-html.mjs.map

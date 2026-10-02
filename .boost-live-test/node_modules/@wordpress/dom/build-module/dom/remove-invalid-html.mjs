// packages/dom/src/dom/remove-invalid-html.js
import cleanNodeList from "./clean-node-list.mjs";
function removeInvalidHTML(HTML, schema, inline) {
  const doc = document.implementation.createHTMLDocument("");
  doc.body.innerHTML = HTML;
  cleanNodeList(doc.body.childNodes, doc, schema, inline);
  return doc.body.innerHTML;
}
export {
  removeInvalidHTML as default
};
//# sourceMappingURL=remove-invalid-html.mjs.map

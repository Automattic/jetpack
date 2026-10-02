// packages/rich-text/src/create-element.js
function createElement({ implementation }, html) {
  if (!createElement.body) {
    createElement.body = implementation.createHTMLDocument("").body;
  }
  createElement.body.innerHTML = html;
  return createElement.body;
}
export {
  createElement
};
//# sourceMappingURL=create-element.mjs.map

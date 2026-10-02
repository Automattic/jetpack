// packages/components/src/modal/aria-helper.ts
var LIVE_REGION_ARIA_ROLES = /* @__PURE__ */ new Set(["alert", "status", "log", "marquee", "timer"]);
var hiddenElementsByDepth = [];
function modalize(modalElement) {
  const elements = Array.from(document.body.children);
  const hiddenElements = [];
  hiddenElementsByDepth.push(hiddenElements);
  for (const element of elements) {
    if (element === modalElement) {
      continue;
    }
    if (elementShouldBeHidden(element)) {
      element.setAttribute("aria-hidden", "true");
      hiddenElements.push(element);
    }
  }
}
function elementShouldBeHidden(element) {
  const role = element.getAttribute("role");
  return !(element.tagName === "SCRIPT" || element.hasAttribute("hidden") || element.hasAttribute("aria-hidden") || element.hasAttribute("aria-live") || role && LIVE_REGION_ARIA_ROLES.has(role));
}
function unmodalize() {
  const hiddenElements = hiddenElementsByDepth.pop();
  if (!hiddenElements) {
    return;
  }
  for (const element of hiddenElements) {
    element.removeAttribute("aria-hidden");
  }
}
export {
  elementShouldBeHidden,
  modalize,
  unmodalize
};
//# sourceMappingURL=aria-helper.mjs.map

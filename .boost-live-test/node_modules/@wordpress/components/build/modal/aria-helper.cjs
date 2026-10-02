"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// packages/components/src/modal/aria-helper.ts
var aria_helper_exports = {};
__export(aria_helper_exports, {
  elementShouldBeHidden: () => elementShouldBeHidden,
  modalize: () => modalize,
  unmodalize: () => unmodalize
});
module.exports = __toCommonJS(aria_helper_exports);
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  elementShouldBeHidden,
  modalize,
  unmodalize
});
//# sourceMappingURL=aria-helper.cjs.map

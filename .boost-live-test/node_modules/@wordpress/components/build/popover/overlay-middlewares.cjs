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

// packages/components/src/popover/overlay-middlewares.tsx
var overlay_middlewares_exports = {};
__export(overlay_middlewares_exports, {
  overlayMiddlewares: () => overlayMiddlewares
});
module.exports = __toCommonJS(overlay_middlewares_exports);
var import_react_dom = require("@floating-ui/react-dom");
function overlayMiddlewares() {
  return [{
    name: "overlay",
    fn({
      rects
    }) {
      return rects.reference;
    }
  }, (0, import_react_dom.size)({
    apply({
      rects,
      elements
    }) {
      const {
        firstElementChild
      } = elements.floating ?? {};
      if (!(firstElementChild instanceof HTMLElement)) {
        return;
      }
      Object.assign(firstElementChild.style, {
        width: `${rects.reference.width}px`,
        height: `${rects.reference.height}px`
      });
    }
  })];
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  overlayMiddlewares
});
//# sourceMappingURL=overlay-middlewares.cjs.map

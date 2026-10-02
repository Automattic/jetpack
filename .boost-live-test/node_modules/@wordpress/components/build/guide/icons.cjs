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

// packages/components/src/guide/icons.tsx
var icons_exports = {};
__export(icons_exports, {
  PageControlIcon: () => PageControlIcon
});
module.exports = __toCommonJS(icons_exports);
var import_primitives = require("@wordpress/primitives");
var import_jsx_runtime = require("react/jsx-runtime");
var PageControlIcon = () => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_primitives.SVG, {
  width: "8",
  height: "8",
  fill: "none",
  xmlns: "http://www.w3.org/2000/svg",
  children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_primitives.Circle, {
    cx: "4",
    cy: "4",
    r: "4"
  })
});
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  PageControlIcon
});
//# sourceMappingURL=icons.cjs.map

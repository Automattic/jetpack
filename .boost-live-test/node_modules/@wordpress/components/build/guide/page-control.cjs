"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// packages/components/src/guide/page-control.tsx
var page_control_exports = {};
__export(page_control_exports, {
  default: () => PageControl
});
module.exports = __toCommonJS(page_control_exports);
var import_i18n = require("@wordpress/i18n");
var import_button = __toESM(require("../button/index.cjs"));
var import_icons = require("./icons.cjs");
var import_jsx_runtime = require("react/jsx-runtime");
function PageControl({
  currentPage,
  numberOfPages,
  setCurrentPage
}) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
    className: "components-guide__page-control",
    "aria-label": (0, import_i18n.__)("Guide controls"),
    children: Array.from({
      length: numberOfPages
    }).map((_, page) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
      // Set aria-current="step" on the active page, see https://www.w3.org/TR/wai-aria-1.1/#aria-current
      "aria-current": page === currentPage ? "step" : void 0,
      children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_button.default, {
        size: "small",
        icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_icons.PageControlIcon, {}),
        "aria-label": (0, import_i18n.sprintf)(
          /* translators: 1: current page number 2: total number of pages */
          (0, import_i18n.__)("Page %1$d of %2$d"),
          page + 1,
          numberOfPages
        ),
        onClick: () => setCurrentPage(page)
      }, page)
    }, page))
  });
}
//# sourceMappingURL=page-control.cjs.map

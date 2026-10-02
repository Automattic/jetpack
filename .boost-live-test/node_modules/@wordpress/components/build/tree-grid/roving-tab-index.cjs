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

// packages/components/src/tree-grid/roving-tab-index.tsx
var roving_tab_index_exports = {};
__export(roving_tab_index_exports, {
  default: () => RovingTabIndex
});
module.exports = __toCommonJS(roving_tab_index_exports);
var import_element = require("@wordpress/element");
var import_roving_tab_index_context = require("./roving-tab-index-context.cjs");
var import_jsx_runtime = require("react/jsx-runtime");
function RovingTabIndex({
  children
}) {
  const [lastFocusedElement, setLastFocusedElement] = (0, import_element.useState)();
  const providerValue = (0, import_element.useMemo)(() => ({
    lastFocusedElement,
    setLastFocusedElement
  }), [lastFocusedElement]);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_roving_tab_index_context.RovingTabIndexProvider, {
    value: providerValue,
    children
  });
}
//# sourceMappingURL=roving-tab-index.cjs.map

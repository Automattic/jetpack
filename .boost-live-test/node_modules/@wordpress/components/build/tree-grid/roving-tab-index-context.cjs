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

// packages/components/src/tree-grid/roving-tab-index-context.ts
var roving_tab_index_context_exports = {};
__export(roving_tab_index_context_exports, {
  RovingTabIndexProvider: () => RovingTabIndexProvider,
  useRovingTabIndexContext: () => useRovingTabIndexContext
});
module.exports = __toCommonJS(roving_tab_index_context_exports);
var import_element = require("@wordpress/element");
var RovingTabIndexContext = (0, import_element.createContext)(void 0);
RovingTabIndexContext.displayName = "RovingTabIndexContext";
var useRovingTabIndexContext = () => (0, import_element.useContext)(RovingTabIndexContext);
var RovingTabIndexProvider = RovingTabIndexContext.Provider;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  RovingTabIndexProvider,
  useRovingTabIndexContext
});
//# sourceMappingURL=roving-tab-index-context.cjs.map

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

// packages/ui/src/tabs/index.ts
var tabs_exports = {};
__export(tabs_exports, {
  List: () => import_list.List,
  Panel: () => import_panel.Panel,
  Root: () => import_root.Root,
  Tab: () => import_tab.Tab
});
module.exports = __toCommonJS(tabs_exports);
var import_list = require("./list.cjs");
var import_panel = require("./panel.cjs");
var import_root = require("./root.cjs");
var import_tab = require("./tab.cjs");
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  List,
  Panel,
  Root,
  Tab
});
//# sourceMappingURL=index.cjs.map

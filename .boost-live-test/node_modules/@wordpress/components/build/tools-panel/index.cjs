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

// packages/components/src/tools-panel/index.ts
var tools_panel_exports = {};
__export(tools_panel_exports, {
  ToolsPanel: () => import_tools_panel.default,
  ToolsPanelContext: () => import_context.ToolsPanelContext,
  ToolsPanelItem: () => import_tools_panel_item.default
});
module.exports = __toCommonJS(tools_panel_exports);
var import_tools_panel = __toESM(require("./tools-panel/index.cjs"));
var import_tools_panel_item = __toESM(require("./tools-panel-item/index.cjs"));
var import_context = require("./context.cjs");
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ToolsPanel,
  ToolsPanelContext,
  ToolsPanelItem
});
//# sourceMappingURL=index.cjs.map

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

// packages/ui/src/form/primitives/fieldset/index.ts
var fieldset_exports = {};
__export(fieldset_exports, {
  Description: () => import_description.FieldsetDescription,
  Details: () => import_details.FieldsetDetails,
  Legend: () => import_legend.FieldsetLegend,
  Root: () => import_root.FieldsetRoot
});
module.exports = __toCommonJS(fieldset_exports);
var import_root = require("./root.cjs");
var import_legend = require("./legend.cjs");
var import_description = require("./description.cjs");
var import_details = require("./details.cjs");
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Description,
  Details,
  Legend,
  Root
});
//# sourceMappingURL=index.cjs.map

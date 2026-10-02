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

// packages/url/src/clean-for-slug.ts
var clean_for_slug_exports = {};
__export(clean_for_slug_exports, {
  cleanForSlug: () => cleanForSlug
});
module.exports = __toCommonJS(clean_for_slug_exports);
var import_remove_accents = __toESM(require("remove-accents"));
function cleanForSlug(string) {
  if (!string) {
    return "";
  }
  return (0, import_remove_accents.default)(string).replace(/(&nbsp;|&ndash;|&mdash;)/g, "-").replace(/[\s\./]+/g, "-").replace(/&\S+?;/g, "").replace(/[^\p{L}\p{N}_-]+/gu, "").toLowerCase().replace(/-+/g, "-").replace(/(^-+)|(-+$)/g, "");
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  cleanForSlug
});
//# sourceMappingURL=clean-for-slug.cjs.map

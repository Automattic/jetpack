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

// packages/components/src/focal-point-picker/utils.ts
var utils_exports = {};
__export(utils_exports, {
  INITIAL_BOUNDS: () => INITIAL_BOUNDS,
  fractionToPercentage: () => fractionToPercentage,
  getExtension: () => getExtension,
  isVideoType: () => isVideoType
});
module.exports = __toCommonJS(utils_exports);
var INITIAL_BOUNDS = {
  width: 200,
  height: 170
};
var VIDEO_EXTENSIONS = ["avi", "mpg", "mpeg", "mov", "mp4", "m4v", "ogg", "ogv", "webm", "wmv"];
function getExtension(filename = "") {
  const parts = filename.split(".");
  return parts[parts.length - 1];
}
function isVideoType(filename = "") {
  if (!filename) {
    return false;
  }
  return filename.startsWith("data:video/") || VIDEO_EXTENSIONS.includes(getExtension(filename));
}
function fractionToPercentage(fraction) {
  return Math.round(fraction * 100);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  INITIAL_BOUNDS,
  fractionToPercentage,
  getExtension,
  isVideoType
});
//# sourceMappingURL=utils.cjs.map

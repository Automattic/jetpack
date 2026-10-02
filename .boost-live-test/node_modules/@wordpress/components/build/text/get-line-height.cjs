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

// packages/components/src/text/get-line-height.ts
var get_line_height_exports = {};
__export(get_line_height_exports, {
  getLineHeight: () => getLineHeight
});
module.exports = __toCommonJS(get_line_height_exports);
var import_space = require("../utils/space.cjs");
var import_utils = require("../utils/index.cjs");
function getLineHeight(adjustLineHeightForInnerControls, lineHeight) {
  if (lineHeight) {
    return lineHeight;
  }
  if (!adjustLineHeightForInnerControls) {
    return;
  }
  let value = `calc(${import_utils.CONFIG.controlHeight} + ${(0, import_space.space)(2)})`;
  switch (adjustLineHeightForInnerControls) {
    case "large":
      value = `calc(${import_utils.CONFIG.controlHeightLarge} + ${(0, import_space.space)(2)})`;
      break;
    case "small":
      value = `calc(${import_utils.CONFIG.controlHeightSmall} + ${(0, import_space.space)(2)})`;
      break;
    case "xSmall":
      value = `calc(${import_utils.CONFIG.controlHeightXSmall} + ${(0, import_space.space)(2)})`;
      break;
    default:
      break;
  }
  return value;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  getLineHeight
});
//# sourceMappingURL=get-line-height.cjs.map

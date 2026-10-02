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

// packages/redux-routine/src/is-action.ts
var is_action_exports = {};
__export(is_action_exports, {
  isAction: () => isAction,
  isActionOfType: () => isActionOfType
});
module.exports = __toCommonJS(is_action_exports);
var import_is_plain_object = require("is-plain-object");
function isAction(object) {
  return (0, import_is_plain_object.isPlainObject)(object) && typeof object.type === "string";
}
function isActionOfType(object, expectedType) {
  return isAction(object) && object.type === expectedType;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  isAction,
  isActionOfType
});
//# sourceMappingURL=is-action.cjs.map

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

// packages/dom/src/utils/assert-is-defined.ts
var assert_is_defined_exports = {};
__export(assert_is_defined_exports, {
  assertIsDefined: () => assertIsDefined
});
module.exports = __toCommonJS(assert_is_defined_exports);
function assertIsDefined(val, name) {
  if (process.env.NODE_ENV !== "production" && (val === void 0 || val === null)) {
    throw new Error(
      `Expected '${name}' to be defined, but received ${val}`
    );
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  assertIsDefined
});
//# sourceMappingURL=assert-is-defined.cjs.map

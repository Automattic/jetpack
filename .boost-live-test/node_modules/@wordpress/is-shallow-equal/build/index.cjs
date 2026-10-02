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

// packages/is-shallow-equal/src/index.ts
var index_exports = {};
__export(index_exports, {
  default: () => isShallowEqual,
  isShallowEqual: () => isShallowEqual,
  isShallowEqualArrays: () => import_arrays.default,
  isShallowEqualObjects: () => import_objects.default
});
module.exports = __toCommonJS(index_exports);
var import_objects = __toESM(require("./objects.cjs"));
var import_arrays = __toESM(require("./arrays.cjs"));
function isShallowEqual(a, b) {
  if (a && b) {
    if (a.constructor === Object && b.constructor === Object) {
      return (0, import_objects.default)(a, b);
    } else if (Array.isArray(a) && Array.isArray(b)) {
      return (0, import_arrays.default)(a, b);
    }
  }
  return a === b;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  isShallowEqual,
  isShallowEqualArrays,
  isShallowEqualObjects
});
//# sourceMappingURL=index.cjs.map

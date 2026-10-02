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

// packages/compose/src/higher-order/pipe.ts
var pipe_exports = {};
__export(pipe_exports, {
  basePipe: () => basePipe,
  default: () => pipe_default
});
module.exports = __toCommonJS(pipe_exports);
var basePipe = (reverse = false) => (...funcs) => (...args) => {
  const functions = funcs.flat();
  if (reverse) {
    functions.reverse();
  }
  return functions.reduce(
    (prev, func) => [func(...prev)],
    args
  )[0];
};
var pipe = basePipe();
var pipe_default = pipe;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  basePipe
});
//# sourceMappingURL=pipe.cjs.map

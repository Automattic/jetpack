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

// packages/url/src/get-query-arg.ts
var get_query_arg_exports = {};
__export(get_query_arg_exports, {
  getQueryArg: () => getQueryArg
});
module.exports = __toCommonJS(get_query_arg_exports);
var import_get_query_args = require("./get-query-args.cjs");
function getQueryArg(url, arg) {
  return (0, import_get_query_args.getQueryArgs)(url)[arg];
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  getQueryArg
});
//# sourceMappingURL=get-query-arg.cjs.map

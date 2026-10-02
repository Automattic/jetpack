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

// packages/rich-text/src/store/index.js
var store_exports = {};
__export(store_exports, {
  store: () => store
});
module.exports = __toCommonJS(store_exports);
var import_data = require("@wordpress/data");
var import_reducer = __toESM(require("./reducer.cjs"));
var selectors = __toESM(require("./selectors.cjs"));
var actions = __toESM(require("./actions.cjs"));
var STORE_NAME = "core/rich-text";
var store = (0, import_data.createReduxStore)(STORE_NAME, {
  reducer: import_reducer.default,
  selectors,
  actions
});
(0, import_data.register)(store);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  store
});
//# sourceMappingURL=index.cjs.map

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

// packages/components/src/context/get-styled-class-name-from-key.ts
var get_styled_class_name_from_key_exports = {};
__export(get_styled_class_name_from_key_exports, {
  getStyledClassNameFromKey: () => getStyledClassNameFromKey
});
module.exports = __toCommonJS(get_styled_class_name_from_key_exports);
var import_change_case = require("change-case");
var import_memize = __toESM(require("memize"));
function getStyledClassName(namespace) {
  const kebab = (0, import_change_case.paramCase)(namespace);
  return `components-${kebab}`;
}
var getStyledClassNameFromKey = (0, import_memize.default)(getStyledClassName);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  getStyledClassNameFromKey
});
//# sourceMappingURL=get-styled-class-name-from-key.cjs.map

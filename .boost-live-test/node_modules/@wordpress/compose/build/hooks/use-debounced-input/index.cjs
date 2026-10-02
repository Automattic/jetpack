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

// packages/compose/src/hooks/use-debounced-input/index.ts
var use_debounced_input_exports = {};
__export(use_debounced_input_exports, {
  default: () => useDebouncedInput
});
module.exports = __toCommonJS(use_debounced_input_exports);
var import_element = require("@wordpress/element");
var import_use_debounce = __toESM(require("../use-debounce/index.cjs"));
function useDebouncedInput(defaultValue = "") {
  const [input, setInput] = (0, import_element.useState)(defaultValue);
  const [debouncedInput, setDebouncedState] = (0, import_element.useState)(defaultValue);
  const setDebouncedInput = (0, import_use_debounce.default)(setDebouncedState, 250);
  (0, import_element.useEffect)(() => {
    setDebouncedInput(input);
  }, [input, setDebouncedInput]);
  return [input, setInput, debouncedInput];
}
//# sourceMappingURL=index.cjs.map

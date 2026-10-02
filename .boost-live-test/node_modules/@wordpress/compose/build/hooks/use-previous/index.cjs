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

// packages/compose/src/hooks/use-previous/index.ts
var use_previous_exports = {};
__export(use_previous_exports, {
  default: () => usePrevious
});
module.exports = __toCommonJS(use_previous_exports);
var import_element = require("@wordpress/element");
function usePrevious(value) {
  const ref = (0, import_element.useRef)(void 0);
  (0, import_element.useEffect)(() => {
    ref.current = value;
  }, [value]);
  return ref.current;
}
//# sourceMappingURL=index.cjs.map

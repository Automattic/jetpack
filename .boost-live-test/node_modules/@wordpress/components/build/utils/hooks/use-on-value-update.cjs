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

// packages/components/src/utils/hooks/use-on-value-update.ts
var use_on_value_update_exports = {};
__export(use_on_value_update_exports, {
  useOnValueUpdate: () => useOnValueUpdate
});
module.exports = __toCommonJS(use_on_value_update_exports);
var import_compose = require("@wordpress/compose");
var import_element = require("@wordpress/element");
function useOnValueUpdate(value, onUpdate) {
  const previousValueRef = (0, import_element.useRef)(value);
  const updateCallbackEvent = (0, import_compose.useEvent)(onUpdate);
  (0, import_element.useLayoutEffect)(() => {
    if (previousValueRef.current !== value) {
      updateCallbackEvent({
        previousValue: previousValueRef.current
      });
      previousValueRef.current = value;
    }
  }, [updateCallbackEvent, value]);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  useOnValueUpdate
});
//# sourceMappingURL=use-on-value-update.cjs.map

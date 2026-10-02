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

// packages/components/src/toggle-group-control/toggle-group-control/utils.ts
var utils_exports = {};
__export(utils_exports, {
  useComputeControlledOrUncontrolledValue: () => useComputeControlledOrUncontrolledValue
});
module.exports = __toCommonJS(utils_exports);
var import_compose = require("@wordpress/compose");
var import_element = require("@wordpress/element");
function useComputeControlledOrUncontrolledValue(valueProp) {
  const isInitialRenderRef = (0, import_element.useRef)(true);
  const prevValueProp = (0, import_compose.usePrevious)(valueProp);
  const prevIsControlledRef = (0, import_element.useRef)(false);
  (0, import_element.useEffect)(() => {
    if (isInitialRenderRef.current) {
      isInitialRenderRef.current = false;
    }
  }, []);
  const isControlled = prevIsControlledRef.current || !isInitialRenderRef.current && prevValueProp !== valueProp;
  (0, import_element.useEffect)(() => {
    prevIsControlledRef.current = isControlled;
  }, [isControlled]);
  if (isControlled) {
    return {
      value: valueProp ?? "",
      defaultValue: void 0
    };
  }
  return {
    value: void 0,
    defaultValue: valueProp
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  useComputeControlledOrUncontrolledValue
});
//# sourceMappingURL=utils.cjs.map

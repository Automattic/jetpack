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

// packages/components/src/range-control/utils.ts
var utils_exports = {};
__export(utils_exports, {
  floatClamp: () => floatClamp,
  useControlledRangeValue: () => useControlledRangeValue
});
module.exports = __toCommonJS(utils_exports);
var import_element = require("@wordpress/element");
var import_hooks = require("../utils/hooks/index.cjs");
var import_math = require("../utils/math.cjs");
function floatClamp(value, min, max) {
  if (typeof value !== "number") {
    return null;
  }
  return parseFloat(`${(0, import_math.clamp)(value, min, max)}`);
}
function useControlledRangeValue(settings) {
  const {
    min,
    max,
    value: valueProp,
    initial
  } = settings;
  const [state, setInternalState] = (0, import_hooks.useControlledState)(floatClamp(valueProp, min, max), {
    initial: floatClamp(initial ?? null, min, max),
    fallback: null
  });
  const setState = (0, import_element.useCallback)((nextValue) => {
    if (nextValue === null) {
      setInternalState(null);
    } else {
      setInternalState(floatClamp(nextValue, min, max));
    }
  }, [min, max, setInternalState]);
  return [state, setState];
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  floatClamp,
  useControlledRangeValue
});
//# sourceMappingURL=utils.cjs.map

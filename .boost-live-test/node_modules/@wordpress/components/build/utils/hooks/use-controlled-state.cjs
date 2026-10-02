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

// packages/components/src/utils/hooks/use-controlled-state.js
var use_controlled_state_exports = {};
__export(use_controlled_state_exports, {
  default: () => use_controlled_state_default
});
module.exports = __toCommonJS(use_controlled_state_exports);
var import_element = require("@wordpress/element");
var import_values = require("../values.cjs");
var defaultOptions = {
  initial: void 0,
  /**
   * Defaults to empty string, as that is preferred for usage with
   * <input />, <textarea />, and <select /> form elements.
   */
  fallback: ""
};
function useControlledState(currentState, options = defaultOptions) {
  const {
    initial,
    fallback
  } = {
    ...defaultOptions,
    ...options
  };
  const [internalState, setInternalState] = (0, import_element.useState)(currentState);
  const hasCurrentState = (0, import_values.isValueDefined)(currentState);
  (0, import_element.useEffect)(() => {
    if (hasCurrentState && internalState) {
      setInternalState(void 0);
    }
  }, [hasCurrentState, internalState]);
  const state = (0, import_values.getDefinedValue)([currentState, internalState, initial], fallback);
  const setState = (0, import_element.useCallback)((nextState) => {
    if (!hasCurrentState) {
      setInternalState(nextState);
    }
  }, [hasCurrentState]);
  return [state, setState];
}
var use_controlled_state_default = useControlledState;
//# sourceMappingURL=use-controlled-state.cjs.map

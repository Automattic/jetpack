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

// packages/components/src/input-control/reducer/state.ts
var state_exports = {};
__export(state_exports, {
  initialInputControlState: () => initialInputControlState,
  initialStateReducer: () => initialStateReducer
});
module.exports = __toCommonJS(state_exports);
var initialStateReducer = (state) => state;
var initialInputControlState = {
  error: null,
  initialValue: "",
  isDirty: false,
  isDragEnabled: false,
  isDragging: false,
  isPressEnterToChange: false,
  value: ""
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  initialInputControlState,
  initialStateReducer
});
//# sourceMappingURL=state.cjs.map

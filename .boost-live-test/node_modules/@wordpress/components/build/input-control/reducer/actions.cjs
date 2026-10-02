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

// packages/components/src/input-control/reducer/actions.ts
var actions_exports = {};
__export(actions_exports, {
  CHANGE: () => CHANGE,
  COMMIT: () => COMMIT,
  CONTROL: () => CONTROL,
  DRAG: () => DRAG,
  DRAG_END: () => DRAG_END,
  DRAG_START: () => DRAG_START,
  INVALIDATE: () => INVALIDATE,
  PRESS_DOWN: () => PRESS_DOWN,
  PRESS_ENTER: () => PRESS_ENTER,
  PRESS_UP: () => PRESS_UP,
  RESET: () => RESET
});
module.exports = __toCommonJS(actions_exports);
var CHANGE = "CHANGE";
var COMMIT = "COMMIT";
var CONTROL = "CONTROL";
var DRAG_END = "DRAG_END";
var DRAG_START = "DRAG_START";
var DRAG = "DRAG";
var INVALIDATE = "INVALIDATE";
var PRESS_DOWN = "PRESS_DOWN";
var PRESS_ENTER = "PRESS_ENTER";
var PRESS_UP = "PRESS_UP";
var RESET = "RESET";
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CHANGE,
  COMMIT,
  CONTROL,
  DRAG,
  DRAG_END,
  DRAG_START,
  INVALIDATE,
  PRESS_DOWN,
  PRESS_ENTER,
  PRESS_UP,
  RESET
});
//# sourceMappingURL=actions.cjs.map

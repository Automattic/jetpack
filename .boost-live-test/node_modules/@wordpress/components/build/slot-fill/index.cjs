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

// packages/components/src/slot-fill/index.tsx
var slot_fill_exports = {};
__export(slot_fill_exports, {
  Fill: () => import_fill.default,
  Provider: () => Provider,
  Slot: () => Slot,
  createSlotFill: () => createSlotFill,
  useSlot: () => import_use_slot.default,
  useSlotFills: () => import_use_slot_fills.default
});
module.exports = __toCommonJS(slot_fill_exports);
var import_element = require("@wordpress/element");
var import_fill = __toESM(require("./fill.cjs"));
var import_slot = __toESM(require("./slot.cjs"));
var import_slot2 = __toESM(require("./bubbles-virtually/slot.cjs"));
var import_provider = __toESM(require("./provider.cjs"));
var import_context = __toESM(require("./context.cjs"));
var import_jsx_runtime = require("react/jsx-runtime");
var import_use_slot = __toESM(require("./bubbles-virtually/use-slot.cjs"));
var import_use_slot_fills = __toESM(require("./bubbles-virtually/use-slot-fills.cjs"));
var Slot = (0, import_element.forwardRef)((props, ref) => {
  const {
    bubblesVirtually,
    ...restProps
  } = props;
  if (bubblesVirtually) {
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_slot2.default, {
      ...restProps,
      ref
    });
  }
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_slot.default, {
    ...restProps
  });
});
Slot.displayName = "Slot";
function Provider({
  children,
  passthrough = false
}) {
  const parent = (0, import_element.useContext)(import_context.default);
  if (!parent.isDefault && passthrough) {
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, {
      children
    });
  }
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_provider.default, {
    children
  });
}
Provider.displayName = "SlotFillProvider";
function createSlotFill(key) {
  const baseName = typeof key === "symbol" ? key.description : key;
  const FillComponent = (props) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_fill.default, {
    name: key,
    ...props
  });
  FillComponent.displayName = `${baseName}Fill`;
  const SlotComponent = (0, import_element.forwardRef)((props, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Slot, {
    name: key,
    ref,
    ...props
  }));
  SlotComponent.displayName = `${baseName}Slot`;
  SlotComponent.__unstableName = key;
  return {
    name: key,
    Fill: FillComponent,
    Slot: SlotComponent
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Fill,
  Provider,
  Slot,
  createSlotFill,
  useSlot,
  useSlotFills
});
//# sourceMappingURL=index.cjs.map

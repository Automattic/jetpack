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

// packages/components/src/slot-fill/provider.tsx
var provider_exports = {};
__export(provider_exports, {
  SlotFillProvider: () => SlotFillProvider,
  default: () => provider_default
});
module.exports = __toCommonJS(provider_exports);
var import_compose = require("@wordpress/compose");
var import_element = require("@wordpress/element");
var import_is_shallow_equal = require("@wordpress/is-shallow-equal");
var import_context = __toESM(require("./context.cjs"));
var import_jsx_runtime = require("react/jsx-runtime");
function createSlotRegistry() {
  const slots = (0, import_compose.observableMap)();
  const fills = (0, import_compose.observableMap)();
  function registerSlot(name, slot) {
    slots.set(name, slot);
  }
  function unregisterSlot(name, instance) {
    const currentSlot = slots.get(name);
    if (!currentSlot || currentSlot.instance !== instance) {
      return;
    }
    slots.delete(name);
  }
  function updateSlot(name, slot) {
    if (slot.type !== "portal") {
      return;
    }
    const slotForName = slots.get(name);
    if (!slotForName) {
      return;
    }
    if (slotForName.type !== "portal") {
      return;
    }
    if (slotForName.instance !== slot.instance) {
      return;
    }
    if ((0, import_is_shallow_equal.isShallowEqual)(slotForName.fillProps, slot.fillProps)) {
      return;
    }
    slots.set(name, slot);
  }
  function registerFill(name, fill) {
    fills.set(name, [...fills.get(name) || [], fill]);
  }
  function unregisterFill(name, instance) {
    const fillsForName = fills.get(name);
    if (!fillsForName) {
      return;
    }
    fills.set(name, fillsForName.filter((fill) => fill.instance !== instance));
  }
  function updateFill(name, fill) {
    const fillsForName = fills.get(name);
    if (!fillsForName) {
      return;
    }
    const fillForInstance = fillsForName.find((f) => f.instance === fill.instance);
    if (!fillForInstance) {
      return;
    }
    if (fillForInstance.children === fill.children) {
      return;
    }
    fills.set(name, fillsForName.map((f) => {
      if (f.instance === fill.instance) {
        return fill;
      }
      return f;
    }));
  }
  return {
    slots,
    fills,
    registerSlot,
    unregisterSlot,
    updateSlot,
    registerFill,
    unregisterFill,
    updateFill
  };
}
function SlotFillProvider({
  children
}) {
  const [contextValue] = (0, import_element.useState)(createSlotRegistry);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_context.default.Provider, {
    value: contextValue,
    children
  });
}
var provider_default = SlotFillProvider;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  SlotFillProvider
});
//# sourceMappingURL=provider.cjs.map

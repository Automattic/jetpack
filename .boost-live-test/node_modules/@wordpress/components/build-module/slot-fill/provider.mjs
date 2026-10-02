// packages/components/src/slot-fill/provider.tsx
import { observableMap } from "@wordpress/compose";
import { useState } from "@wordpress/element";
import { isShallowEqual } from "@wordpress/is-shallow-equal";
import SlotFillContext from "./context.mjs";
import { jsx as _jsx } from "react/jsx-runtime";
function createSlotRegistry() {
  const slots = observableMap();
  const fills = observableMap();
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
    if (isShallowEqual(slotForName.fillProps, slot.fillProps)) {
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
  const [contextValue] = useState(createSlotRegistry);
  return /* @__PURE__ */ _jsx(SlotFillContext.Provider, {
    value: contextValue,
    children
  });
}
var provider_default = SlotFillProvider;
export {
  SlotFillProvider,
  provider_default as default
};
//# sourceMappingURL=provider.mjs.map

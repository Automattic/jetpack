// packages/components/src/slot-fill/index.tsx
import { forwardRef, useContext } from "@wordpress/element";
import Fill from "./fill.mjs";
import BaseSlot from "./slot.mjs";
import BubblesVirtuallySlot from "./bubbles-virtually/slot.mjs";
import SlotFillProvider from "./provider.mjs";
import SlotFillContext from "./context.mjs";
import { jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { default as default2 } from "./bubbles-virtually/use-slot.mjs";
import { default as default3 } from "./bubbles-virtually/use-slot-fills.mjs";
var Slot = forwardRef((props, ref) => {
  const {
    bubblesVirtually,
    ...restProps
  } = props;
  if (bubblesVirtually) {
    return /* @__PURE__ */ _jsx(BubblesVirtuallySlot, {
      ...restProps,
      ref
    });
  }
  return /* @__PURE__ */ _jsx(BaseSlot, {
    ...restProps
  });
});
Slot.displayName = "Slot";
function Provider({
  children,
  passthrough = false
}) {
  const parent = useContext(SlotFillContext);
  if (!parent.isDefault && passthrough) {
    return /* @__PURE__ */ _jsx(_Fragment, {
      children
    });
  }
  return /* @__PURE__ */ _jsx(SlotFillProvider, {
    children
  });
}
Provider.displayName = "SlotFillProvider";
function createSlotFill(key) {
  const baseName = typeof key === "symbol" ? key.description : key;
  const FillComponent = (props) => /* @__PURE__ */ _jsx(Fill, {
    name: key,
    ...props
  });
  FillComponent.displayName = `${baseName}Fill`;
  const SlotComponent = forwardRef((props, ref) => /* @__PURE__ */ _jsx(Slot, {
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
export {
  Fill,
  Provider,
  Slot,
  createSlotFill,
  default2 as useSlot,
  default3 as useSlotFills
};
//# sourceMappingURL=index.mjs.map

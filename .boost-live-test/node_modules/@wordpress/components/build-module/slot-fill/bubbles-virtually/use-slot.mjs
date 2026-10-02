// packages/components/src/slot-fill/bubbles-virtually/use-slot.ts
import { useContext } from "@wordpress/element";
import { useObservableValue } from "@wordpress/compose";
import SlotFillContext from "../context.mjs";
function useSlot(name) {
  const registry = useContext(SlotFillContext);
  const slot = useObservableValue(registry.slots, name);
  let ref;
  if (slot && slot.type === "portal") {
    ref = slot.ref;
  }
  return {
    ref
  };
}
export {
  useSlot as default
};
//# sourceMappingURL=use-slot.mjs.map

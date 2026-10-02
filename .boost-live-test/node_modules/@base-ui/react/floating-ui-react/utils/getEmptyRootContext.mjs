import { PopupTriggerMap } from "../../utils/popups/index.mjs";
import { FloatingRootStore } from "../components/FloatingRootStore.mjs";
export function getEmptyRootContext() {
  return new FloatingRootStore({
    open: false,
    transitionStatus: undefined,
    floatingElement: null,
    referenceElement: null,
    triggerElements: new PopupTriggerMap(),
    floatingId: undefined,
    syncOnly: false,
    nested: false,
    onOpenChange: undefined
  });
}
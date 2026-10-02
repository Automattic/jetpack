// packages/components/src/slot-fill/bubbles-virtually/use-slot-fills.ts
import { useContext, useMemo, useSyncExternalStore } from "@wordpress/element";
import SlotFillContext from "../context.mjs";
function useObservableValueWithSelector(map, name, selector) {
  const subscribe = useMemo(() => (listener) => map.subscribe(name, listener), [map, name]);
  const getValue = () => selector(map.get(name));
  return useSyncExternalStore(subscribe, getValue, getValue);
}
function getLength(array) {
  return array?.length;
}
function useSlotFills(name) {
  const registry = useContext(SlotFillContext);
  const length = useObservableValueWithSelector(registry.fills, name, getLength);
  const fills = useMemo(() => {
    return length !== void 0 ? Array.from({
      length
    }) : void 0;
  }, [length]);
  return fills;
}
export {
  useSlotFills as default
};
//# sourceMappingURL=use-slot-fills.mjs.map

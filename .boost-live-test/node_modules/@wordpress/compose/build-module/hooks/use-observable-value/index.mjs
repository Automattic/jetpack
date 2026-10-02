// packages/compose/src/hooks/use-observable-value/index.ts
import { useMemo, useSyncExternalStore } from "@wordpress/element";
function useObservableValue(map, name) {
  const [subscribe, getValue] = useMemo(
    () => [
      (listener) => map.subscribe(name, listener),
      () => map.get(name)
    ],
    [map, name]
  );
  return useSyncExternalStore(subscribe, getValue, getValue);
}
export {
  useObservableValue as default
};
//# sourceMappingURL=index.mjs.map

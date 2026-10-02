// packages/data/src/components/use-dispatch/use-dispatch-with-map.ts
import { useMemo, useRef } from "@wordpress/element";
import { useIsomorphicLayoutEffect } from "@wordpress/compose";
import useRegistry from "../registry-provider/use-registry.mjs";
var useDispatchWithMap = (dispatchMap, deps) => {
  const registry = useRegistry();
  const currentDispatchMapRef = useRef(dispatchMap);
  useIsomorphicLayoutEffect(() => {
    currentDispatchMapRef.current = dispatchMap;
  });
  return useMemo(() => {
    const currentDispatchProps = currentDispatchMapRef.current(
      registry.dispatch,
      registry
    );
    return Object.fromEntries(
      Object.entries(currentDispatchProps).map(
        ([propName, dispatcher]) => {
          if (typeof dispatcher !== "function") {
            console.warn(
              `Property ${propName} returned from dispatchMap in useDispatchWithMap must be a function.`
            );
          }
          return [
            propName,
            (...args) => currentDispatchMapRef.current(registry.dispatch, registry)[propName](...args)
          ];
        }
      )
    );
  }, [registry, ...deps]);
};
var use_dispatch_with_map_default = useDispatchWithMap;
export {
  use_dispatch_with_map_default as default
};
//# sourceMappingURL=use-dispatch-with-map.mjs.map

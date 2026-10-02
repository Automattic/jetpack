// packages/compose/src/hooks/use-ref-effect/index.ts
import { useCallback, useRef } from "@wordpress/element";
function useRefEffect(callback, dependencies) {
  const cleanupRef = useRef(void 0);
  return useCallback((node) => {
    if (node) {
      cleanupRef.current = callback(node);
    } else if (cleanupRef.current) {
      cleanupRef.current();
    }
  }, dependencies);
}
export {
  useRefEffect as default
};
//# sourceMappingURL=index.mjs.map

// packages/compose/src/hooks/use-event/index.ts
import { useRef, useInsertionEffect, useCallback } from "@wordpress/element";
function useEvent(callback) {
  const ref = useRef(() => {
    throw new Error(
      "Callbacks created with `useEvent` cannot be called during rendering."
    );
  });
  useInsertionEffect(() => {
    ref.current = callback;
  });
  return useCallback(
    (...args) => ref.current?.(...args),
    []
  );
}
export {
  useEvent as default
};
//# sourceMappingURL=index.mjs.map

// packages/components/src/utils/hooks/use-on-value-update.ts
import { useEvent } from "@wordpress/compose";
import { useRef, useLayoutEffect } from "@wordpress/element";
function useOnValueUpdate(value, onUpdate) {
  const previousValueRef = useRef(value);
  const updateCallbackEvent = useEvent(onUpdate);
  useLayoutEffect(() => {
    if (previousValueRef.current !== value) {
      updateCallbackEvent({
        previousValue: previousValueRef.current
      });
      previousValueRef.current = value;
    }
  }, [updateCallbackEvent, value]);
}
export {
  useOnValueUpdate
};
//# sourceMappingURL=use-on-value-update.mjs.map

// packages/components/src/toggle-group-control/toggle-group-control/utils.ts
import { usePrevious } from "@wordpress/compose";
import { useEffect, useRef } from "@wordpress/element";
function useComputeControlledOrUncontrolledValue(valueProp) {
  const isInitialRenderRef = useRef(true);
  const prevValueProp = usePrevious(valueProp);
  const prevIsControlledRef = useRef(false);
  useEffect(() => {
    if (isInitialRenderRef.current) {
      isInitialRenderRef.current = false;
    }
  }, []);
  const isControlled = prevIsControlledRef.current || !isInitialRenderRef.current && prevValueProp !== valueProp;
  useEffect(() => {
    prevIsControlledRef.current = isControlled;
  }, [isControlled]);
  if (isControlled) {
    return {
      value: valueProp ?? "",
      defaultValue: void 0
    };
  }
  return {
    value: void 0,
    defaultValue: valueProp
  };
}
export {
  useComputeControlledOrUncontrolledValue
};
//# sourceMappingURL=utils.mjs.map

// packages/components/src/range-control/utils.ts
import { useCallback } from "@wordpress/element";
import { useControlledState } from "../utils/hooks/index.mjs";
import { clamp } from "../utils/math.mjs";
function floatClamp(value, min, max) {
  if (typeof value !== "number") {
    return null;
  }
  return parseFloat(`${clamp(value, min, max)}`);
}
function useControlledRangeValue(settings) {
  const {
    min,
    max,
    value: valueProp,
    initial
  } = settings;
  const [state, setInternalState] = useControlledState(floatClamp(valueProp, min, max), {
    initial: floatClamp(initial ?? null, min, max),
    fallback: null
  });
  const setState = useCallback((nextValue) => {
    if (nextValue === null) {
      setInternalState(null);
    } else {
      setInternalState(floatClamp(nextValue, min, max));
    }
  }, [min, max, setInternalState]);
  return [state, setState];
}
export {
  floatClamp,
  useControlledRangeValue
};
//# sourceMappingURL=utils.mjs.map

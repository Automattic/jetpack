// packages/components/src/utils/hooks/use-controlled-value.ts
import { useCallback, useState } from "@wordpress/element";
function useControlledValue({
  defaultValue,
  onChange,
  value: valueProp
}) {
  const hasValue = typeof valueProp !== "undefined";
  const initialValue = hasValue ? valueProp : defaultValue;
  const [state, setState] = useState(initialValue);
  const value = hasValue ? valueProp : state;
  const uncontrolledSetValue = useCallback((nextValue, ...args) => {
    setState(nextValue);
    onChange?.(nextValue, ...args);
  }, [onChange]);
  let setValue;
  if (hasValue && typeof onChange === "function") {
    setValue = onChange;
  } else if (!hasValue && typeof onChange === "function") {
    setValue = uncontrolledSetValue;
  } else {
    setValue = setState;
  }
  return [value, setValue];
}
export {
  useControlledValue
};
//# sourceMappingURL=use-controlled-value.mjs.map

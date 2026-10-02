// packages/compose/src/hooks/use-debounced-input/index.ts
import { useEffect, useState } from "@wordpress/element";
import useDebounce from "../use-debounce/index.mjs";
function useDebouncedInput(defaultValue = "") {
  const [input, setInput] = useState(defaultValue);
  const [debouncedInput, setDebouncedState] = useState(defaultValue);
  const setDebouncedInput = useDebounce(setDebouncedState, 250);
  useEffect(() => {
    setDebouncedInput(input);
  }, [input, setDebouncedInput]);
  return [input, setInput, debouncedInput];
}
export {
  useDebouncedInput as default
};
//# sourceMappingURL=index.mjs.map

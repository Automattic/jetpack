// packages/compose/src/hooks/use-previous/index.ts
import { useEffect, useRef } from "@wordpress/element";
function usePrevious(value) {
  const ref = useRef(void 0);
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref.current;
}
export {
  usePrevious as default
};
//# sourceMappingURL=index.mjs.map

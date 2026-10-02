// packages/components/src/utils/hooks/use-update-effect.js
import { useRef, useEffect } from "@wordpress/element";
function useUpdateEffect(effect, deps) {
  const mountedRef = useRef(false);
  useEffect(() => {
    if (mountedRef.current) {
      return effect();
    }
    mountedRef.current = true;
    return void 0;
  }, deps);
  useEffect(() => () => {
    mountedRef.current = false;
  }, []);
}
var use_update_effect_default = useUpdateEffect;
export {
  use_update_effect_default as default
};
//# sourceMappingURL=use-update-effect.mjs.map

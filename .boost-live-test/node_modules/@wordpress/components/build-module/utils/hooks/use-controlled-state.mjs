// packages/components/src/utils/hooks/use-controlled-state.js
import { useEffect, useState, useCallback } from "@wordpress/element";
import { isValueDefined, getDefinedValue } from "../values.mjs";
var defaultOptions = {
  initial: void 0,
  /**
   * Defaults to empty string, as that is preferred for usage with
   * <input />, <textarea />, and <select /> form elements.
   */
  fallback: ""
};
function useControlledState(currentState, options = defaultOptions) {
  const {
    initial,
    fallback
  } = {
    ...defaultOptions,
    ...options
  };
  const [internalState, setInternalState] = useState(currentState);
  const hasCurrentState = isValueDefined(currentState);
  useEffect(() => {
    if (hasCurrentState && internalState) {
      setInternalState(void 0);
    }
  }, [hasCurrentState, internalState]);
  const state = getDefinedValue([currentState, internalState, initial], fallback);
  const setState = useCallback((nextState) => {
    if (!hasCurrentState) {
      setInternalState(nextState);
    }
  }, [hasCurrentState]);
  return [state, setState];
}
var use_controlled_state_default = useControlledState;
export {
  use_controlled_state_default as default
};
//# sourceMappingURL=use-controlled-state.mjs.map

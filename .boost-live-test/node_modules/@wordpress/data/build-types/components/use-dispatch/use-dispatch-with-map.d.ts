import type { DataRegistry } from '../../types';
type DispatchMap = (dispatch: DataRegistry['dispatch'], registry: DataRegistry) => Record<string, (...args: unknown[]) => unknown>;
/**
 * Custom react hook for returning aggregate dispatch actions using the provided
 * dispatchMap.
 *
 * Currently this is an internal api only and is implemented by `withDispatch`
 *
 * @param dispatchMap Receives the `registry.dispatch` function as
 *                    the first argument and the `registry` object
 *                    as the second argument.  Should return an
 *                    object mapping props to functions.
 * @param deps        An array of dependencies for the hook.
 * @return An object mapping props to functions created by the passed
 *         in dispatchMap.
 */
declare const useDispatchWithMap: (dispatchMap: DispatchMap, deps: unknown[]) => Record<string, (...args: unknown[]) => unknown>;
export default useDispatchWithMap;
//# sourceMappingURL=use-dispatch-with-map.d.ts.map
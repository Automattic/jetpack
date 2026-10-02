import type { Callback, Hooks, StoreKey } from '.';
/**
 *
 * Adds the hook to the appropriate hooks container.
 */
export type AddHook = (
/**
 * Name of hook to add
 */
hookName: string, 
/**
 * The unique namespace identifying the callback in the form.
 */
namespace: string, 
/**
 * Function to call when the hook is run.
 */
callback: Callback, 
/**
 * Priority of this hook
 */
priority?: number) => void;
/**
 * Returns a function which, when invoked, will add a hook.
 *
 * @param hooks    Hooks instance.
 * @param storeKey
 *
 * @return  Function that adds a new hook.
 */
declare function createAddHook(hooks: Hooks, storeKey: StoreKey): AddHook;
export default createAddHook;
//# sourceMappingURL=createAddHook.d.ts.map
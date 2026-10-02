import type { Hooks, StoreKey } from './types';
/**
 * Removes the specified callback (or all callbacks) from the hook with a given hookName
 * and namespace.
 */
export type RemoveHook = (
/**
 * The name of the hook to modify.
 */
hookName: string, 
/**
 * The unique namespace identifying the callback in the form `vendor/plugin/function`.
 */
namespace: string) => number | undefined;
/**
 * Returns a function which, when invoked, will remove a specified hook or all
 * hooks by the given name.
 *
 * @param hooks             Hooks instance.
 * @param storeKey
 * @param [removeAll=false] Whether to remove all callbacks for a hookName,
 *                          without regard to namespace. Used to create
 *                          `removeAll*` functions.
 *
 * @return Function that removes hooks.
 */
declare function createRemoveHook(hooks: Hooks, storeKey: StoreKey, removeAll?: boolean): RemoveHook;
export default createRemoveHook;
//# sourceMappingURL=createRemoveHook.d.ts.map
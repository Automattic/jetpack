import type { StoreDescriptor } from './types';
/**
 * Dispatches a control action for triggering a synchronous registry select.
 *
 * Note: This control synchronously returns the current selector value, triggering the
 * resolution, but not waiting for it.
 *
 * @param storeNameOrDescriptor Unique namespace identifier for the store
 * @param selectorName          The name of the selector.
 * @param args                  Arguments for the selector.
 *
 * @example
 * ```js
 * import { controls } from '@wordpress/data';
 *
 * // Action generator using `select`.
 * export function* myAction() {
 *   const isEditorSideBarOpened = yield controls.select( 'core/edit-post', 'isEditorSideBarOpened' );
 *   // Do stuff with the result from the `select`.
 * }
 * ```
 *
 * @return The control descriptor.
 */
declare function select(storeNameOrDescriptor: string | StoreDescriptor, selectorName: string, ...args: unknown[]): {
    type: string;
    storeKey: string;
    selectorName: string;
    args: unknown[];
};
/**
 * Dispatches a control action for triggering and resolving a registry select.
 *
 * Note: when this control action is handled, it automatically considers
 * selectors that may have a resolver. In such case, it will return a `Promise` that resolves
 * after the selector finishes resolving, with the final result value.
 *
 * @param storeNameOrDescriptor Unique namespace identifier for the store
 * @param selectorName          The name of the selector
 * @param args                  Arguments for the selector.
 *
 * @example
 * ```js
 * import { controls } from '@wordpress/data';
 *
 * // Action generator using resolveSelect
 * export function* myAction() {
 * 	const isSidebarOpened = yield controls.resolveSelect( 'core/edit-post', 'isEditorSideBarOpened' );
 * 	// do stuff with the result from the select.
 * }
 * ```
 *
 * @return The control descriptor.
 */
declare function resolveSelect(storeNameOrDescriptor: string | StoreDescriptor<any>, selectorName: string, ...args: any[]): {
    type: string;
    storeKey: string;
    selectorName: string;
    args: any[];
};
/**
 * Dispatches a control action for triggering a registry dispatch.
 *
 * @param storeNameOrDescriptor Unique namespace identifier for the store
 * @param actionName            The name of the action to dispatch
 * @param args                  Arguments for the dispatch action.
 *
 * @example
 * ```js
 * import { controls } from '@wordpress/data-controls';
 *
 * // Action generator using dispatch
 * export function* myAction() {
 *   yield controls.dispatch( 'core/editor', 'togglePublishSidebar' );
 *   // do some other things.
 * }
 * ```
 *
 * @return   The control descriptor.
 */
declare function dispatch(storeNameOrDescriptor: string | StoreDescriptor, actionName: string, ...args: unknown[]): {
    type: string;
    storeKey: string;
    actionName: string;
    args: unknown[];
};
export declare const controls: {
    select: typeof select;
    resolveSelect: typeof resolveSelect;
    dispatch: typeof dispatch;
};
type SelectorControlArgs = {
    storeKey: string;
    selectorName: string;
    args: unknown[];
};
type ActionControlArgs = {
    storeKey: string;
    actionName: string;
    args: unknown[];
};
export declare const builtinControls: {
    "@@data/SELECT": ((registry: import("./types").DataRegistry) => ({ storeKey, selectorName, args }: SelectorControlArgs) => any) & {
        isRegistryControl?: boolean;
    };
    "@@data/RESOLVE_SELECT": ((registry: import("./types").DataRegistry) => ({ storeKey, selectorName, args }: SelectorControlArgs) => any) & {
        isRegistryControl?: boolean;
    };
    "@@data/DISPATCH": ((registry: import("./types").DataRegistry) => ({ storeKey, actionName, args }: ActionControlArgs) => any) & {
        isRegistryControl?: boolean;
    };
};
export {};
//# sourceMappingURL=controls.d.ts.map
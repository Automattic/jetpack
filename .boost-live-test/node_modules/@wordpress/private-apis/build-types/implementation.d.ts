/**
 * wordpress/private-apis – the utilities to enable private cross-package
 * exports of private APIs.
 *
 * This "implementation.ts" file is needed for the sake of the unit tests. It
 * exports more than the public API of the package to aid in testing.
 */
/**
 * Called by a @wordpress package wishing to opt-in to accessing or exposing
 * private private APIs.
 *
 * @param consent    The consent string.
 * @param moduleName The name of the module that is opting in.
 * @return An object containing the lock and unlock functions.
 */
export declare const __dangerousOptInToUnstableAPIsOnlyForCoreModules: (consent: string, moduleName: string) => {
    lock: typeof lock;
    unlock: typeof unlock;
};
/**
 * Binds private data to an object.
 * It does not alter the passed object in any way, only
 * registers it in an internal map of private data.
 *
 * The private data can't be accessed by any other means
 * than the `unlock` function.
 *
 * @example
 * ```js
 * const object = {};
 * const privateData = { a: 1 };
 * lock( object, privateData );
 *
 * object
 * // {}
 *
 * unlock( object );
 * // { a: 1 }
 * ```
 *
 * @param object      The object to bind the private data to.
 * @param privateData The private data to bind to the object.
 */
declare function lock(object: unknown, privateData: unknown): void;
/**
 * Unlocks the private data bound to an object.
 *
 * It does not alter the passed object in any way, only
 * returns the private data paired with it using the `lock()`
 * function.
 *
 * @example
 * ```js
 * const object = {};
 * const privateData = { a: 1 };
 * lock( object, privateData );
 *
 * object
 * // {}
 *
 * unlock( object );
 * // { a: 1 }
 * ```
 *
 * @param object The object to unlock the private data from.
 * @return The private data bound to the object.
 */
declare function unlock<T = any>(object: unknown): T;
/**
 * Private function to allow the unit tests to allow
 * a mock module to access the private APIs.
 *
 * @param name The name of the module.
 */
export declare function allowCoreModule(name: string): void;
/**
 * Private function to allow the unit tests to set
 * a custom list of allowed modules.
 */
export declare function resetAllowedCoreModules(): void;
export {};
//# sourceMappingURL=implementation.d.ts.map
/**
 * Internal dependencies
 */
// Importing the store module registers the `jetpack-connection` @wordpress/data
// store as a side effect. It must run exactly once per page; the shared-stores
// bundle is externalized so it loads once regardless of how many consumers
// depend on the connection store.
import './store.jsx';
import STORE_ID from './store-id.jsx';

/**
 * The registered connection store id (`jetpack-connection`).
 *
 * This tenant is exposed on the package's `/connection` subpath, not the main
 * barrel, so consumers of the other shared stores do not eagerly evaluate it.
 * The name is unique because the bundle entry (`assets/src/js/shared-stores.js`)
 * `export *`s both the barrel and this subpath into the same `JetpackSharedStores`
 * global, where it must not collide with the `store` / `selectors` names other
 * tenants expose.
 */
export const CONNECTION_STORE_ID = STORE_ID;

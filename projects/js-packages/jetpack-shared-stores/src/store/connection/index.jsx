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
 * Exported under a unique name so the package barrel's `export *` does not
 * collide with the `store` / `selectors` names other tenants expose.
 */
export const CONNECTION_STORE_ID = STORE_ID;

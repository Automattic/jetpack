/**
 * Back-compat re-export.
 *
 * The `jetpack-connection` store moved to `@automattic/jetpack-shared-stores`
 * so it is built into a single externalized bundle and registered only once.
 * It is exposed on the package's `/connection` subpath (not the main barrel) so
 * consumers of the other shared stores do not eagerly evaluate it. This shim
 * preserves the historical `./state/store` import path (and the `STORE_ID`
 * name) used by this package's components, hooks, and public barrel.
 */
export { CONNECTION_STORE_ID as STORE_ID } from '@automattic/jetpack-shared-stores/connection';

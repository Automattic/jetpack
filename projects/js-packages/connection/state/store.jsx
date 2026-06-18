/**
 * Back-compat re-export.
 *
 * The `jetpack-connection` store moved to `@automattic/jetpack-shared-stores`
 * so it is built into a single externalized bundle and registered only once.
 * This shim preserves the historical `./state/store` import path (and the
 * `STORE_ID` name) used by this package's components, hooks, and public barrel.
 */
export { CONNECTION_STORE_ID as STORE_ID } from '@automattic/jetpack-shared-stores';

/**
 * Back-compat re-export.
 *
 * The `jetpack-connection` store moved to `@automattic/jetpack-shared-stores`
 * so it is built into a single externalized bundle and registered only once.
 * It is exposed on the package's `/connection` subpath and registers lazily via
 * `initConnectionStore()` rather than as an import side effect, so consumers
 * that don't use the connection store never register it. This shim preserves
 * the historical `./state/store` import path (the `STORE_ID` name) and exposes
 * the initializer.
 */
export {
	CONNECTION_STORE_ID as STORE_ID,
	initConnectionStore,
} from '@automattic/jetpack-shared-stores/connection';

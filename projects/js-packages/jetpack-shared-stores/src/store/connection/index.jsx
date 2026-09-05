/**
 * External dependencies
 */
import restApi from '@automattic/jetpack-api';
import { getScriptData } from '@automattic/jetpack-script-data';
import { createReduxStore, register } from '@wordpress/data';
/**
 * Internal dependencies
 */
import actions from './actions';
import controls from './controls';
import reducer from './reducers';
import resolvers from './resolvers';
import selectors from './selectors';
import STORE_ID from './store-id';

/**
 * The connection store id (`jetpack-connection`). Exposed for consumers that
 * already hold a registered store and only need the id; new code should prefer
 * the store descriptor returned by `initConnectionStore()`.
 */
export const CONNECTION_STORE_ID = STORE_ID;

/** @type {import('@wordpress/data').StoreDescriptor | undefined} */
let store;

/**
 * Initialize and register the Jetpack connection data store.
 *
 * The store is registered lazily on first call rather than as an import side
 * effect, so consumers of the shared-stores bundle that don't use the
 * connection store never register it. The call is idempotent: the first caller
 * registers the store and every caller receives the same store descriptor, so
 * consumers should `select()`/`dispatch()` against the returned value rather
 * than assume the store id is already registered.
 *
 * @return {import('@wordpress/data').StoreDescriptor} The registered connection store descriptor.
 */
export function initConnectionStore() {
	const initialState = window.JP_CONNECTION_INITIAL_STATE || getScriptData()?.connection;

	/*
	 * Configure this bundle's `@automattic/jetpack-api` instance from the
	 * initial state. The store's controls (registerSite, fetchAuthorizationUrl,
	 * ...) call `restApi`, but since this store lives in the externalized
	 * shared-stores bundle it has its own copy of the api singleton, separate
	 * from the consuming app's copy. Without this the store's REST calls would
	 * hit the default root with no nonce and fail.
	 *
	 * This runs on every call (it's a cheap idempotent setter) so that if the
	 * first call happened before the connection script data was available, a
	 * later call still points the api at the right root and nonce.
	 */
	if ( initialState?.apiRoot ) {
		restApi.setApiRoot( initialState.apiRoot );
	}
	if ( initialState?.apiNonce ) {
		restApi.setApiNonce( initialState.apiNonce );
	}

	if ( store ) {
		return store;
	}

	if ( ! initialState ) {
		// eslint-disable-next-line no-console
		console.error(
			'Jetpack Connection package: Initial state is missing. Check documentation to see how to use the Connection composer package to set up the initial state.'
		);
	}

	store = createReduxStore( STORE_ID, {
		__experimentalUseThunks: true,
		reducer,
		actions,
		selectors,
		resolvers,
		controls,
		initialState: initialState || {},
	} );
	register( store );

	return store;
}

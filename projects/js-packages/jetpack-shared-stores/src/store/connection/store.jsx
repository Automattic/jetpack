/* eslint-disable no-console */

import restApi from '@automattic/jetpack-api';
import { getScriptData } from '@automattic/jetpack-script-data';
import actions from './actions';
import controls from './controls';
import reducer from './reducers';
import resolvers from './resolvers';
import selectors from './selectors';
import storeHolder from './store-holder';
import STORE_ID from './store-id';

const initialState = window.JP_CONNECTION_INITIAL_STATE || getScriptData()?.connection;

if ( ! initialState ) {
	console.error(
		'Jetpack Connection package: Initial state is missing. Check documentation to see how to use the Connection composer package to set up the initial state.'
	);
}

/*
 * Configure this bundle's `@automattic/jetpack-api` instance from the initial
 * state. The store's controls (registerSite, fetchAuthorizationUrl, ...) call
 * `restApi`, but since this store now lives in the externalized shared-stores
 * bundle it has its own copy of the api singleton, separate from the consuming
 * app's copy that `useConnection` configures. Without this, the store's REST
 * calls would hit the default root with no nonce and fail (e.g. the site
 * registration request returns HTML and throws a JSON parse error).
 */
if ( initialState?.apiRoot ) {
	restApi.setApiRoot( initialState.apiRoot );
}
if ( initialState?.apiNonce ) {
	restApi.setApiNonce( initialState.apiNonce );
}

storeHolder.mayBeInit( STORE_ID, {
	__experimentalUseThunks: true,
	reducer,
	actions,
	selectors,
	resolvers,
	controls,
	initialState: initialState || {},
} );

export { STORE_ID };

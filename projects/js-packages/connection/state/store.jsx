/* eslint-disable no-console */

import restApi from '@automattic/jetpack-api';
import { getScriptData } from '@automattic/jetpack-script-data';
import actions from './actions';
import controls from './controls';
import decodeInitialState from './decode-initial-state';
import reducer from './reducers';
import resolvers from './resolvers';
import selectors from './selectors';
import storeHolder from './store-holder';
import STORE_ID from './store-id';

const initialState = window.JP_CONNECTION_INITIAL_STATE || getScriptData()?.connection;

/*
 * The registered store's controls call this copy's `restApi`, which otherwise is only configured
 * by hooks such as useConnection. Configure it here, or a request made before one renders has no root.
 */
if ( initialState?.apiRoot ) {
	restApi.setApiRoot( initialState.apiRoot );
}
if ( initialState?.apiNonce ) {
	restApi.setApiNonce( initialState.apiNonce );
}

if ( ! initialState ) {
	console.error(
		'Jetpack Connection package: Initial state is missing. Check documentation to see how to use the Connection composer package to set up the initial state.'
	);
}

storeHolder.mayBeInit( STORE_ID, {
	__experimentalUseThunks: true,
	reducer,
	actions,
	selectors,
	resolvers,
	controls,
	initialState: decodeInitialState( initialState || {} ),
} );

export { STORE_ID };

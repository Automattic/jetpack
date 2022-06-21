/* eslint-disable no-console */

import actions from './actions';
import controls from './controls';
import reducer from './reducers';
import resolvers from './resolvers';
import selectors from './selectors';
import storeHolder from './store-holder';
import STORE_ID from './store-id';

const initialState = window.JP_CONNECTION_INITIAL_STATE;

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
	initialState: initialState || {},
} );

export { STORE_ID };

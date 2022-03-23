/* eslint-disable no-console */

/**
 * Internal dependencies
 */
import reducer from './reducers';
import actions from './actions';
import selectors from './selectors';
import resolvers from './resolvers';
import controls from './controls';
import storeHolder from './store-holder';

const STORE_ID = 'jetpack-connection';

const initialState = window.JP_CONNECTION_INITIAL_STATE;

if ( ! initialState ) {
	console.error(
		'Jetpack Connection package: Initial state is missing. Check documentation to see how to use the Connection composer package to set up the initial state.'
	);
}

storeHolder.mayBeInit( STORE_ID, {
	reducer,
	actions,
	selectors,
	resolvers,
	controls,
	initialState: initialState || {},
} );

export { STORE_ID };

/**
 * Internal dependencies
 */
import reducer from './reducers';
import actions from './actions';
import selectors from './selectors';
import storeHolder from './store-holder';
import resolvers from './resolvers';
import controls from './controls';

const STORE_ID = 'jetpack-connection';

storeHolder.mayBeInit( STORE_ID, {
	reducer,
	actions,
	selectors,
	resolvers,
	controls,
	initialState: window.JP_CONNECTION_INITIAL_STATE || {},
} );

export { STORE_ID };

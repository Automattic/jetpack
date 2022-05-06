/**
 * Internal dependencies
 */
import reducer from './reducers';
import actions from './actions';
import selectors from './selectors';
import resolvers from './resolvers';
import storeHolder from './store-holder';
import camelize from 'camelize';

const STORE_ID = 'jetpack-protect';

/**
 * Inits redux store for Jetpack Protect
 */
function initStore() {
	storeHolder.mayBeInit( STORE_ID, {
		__experimentalUseThunks: true, // never stop experiment :sweat_smile:
		reducer,
		actions,
		selectors,
		resolvers,
		initialState: camelize( window.jetpackProtectInitialState ) || {},
	} );
}

export { STORE_ID, initStore };

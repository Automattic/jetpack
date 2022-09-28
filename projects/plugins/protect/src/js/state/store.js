import camelize from 'camelize';
import actions from './actions';
import reducer from './reducers';
import resolvers from './resolvers';
import selectors from './selectors';
import storeHolder from './store-holder';

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

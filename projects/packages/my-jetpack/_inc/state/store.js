/**
 * Internal dependencies
 */
import reducer from './reducers';
import selectors from './selectors';
import storeHolder from './store-holder';
import resolvers from './resolvers';
import controls from './controls';

const STORE_ID = 'my-jetpack';

/**
 * Inits redux store for my-jetpack
 */
function initStore() {
	storeHolder.mayBeInit( STORE_ID, {
		reducer,
		actions: {},
		selectors,
		resolvers,
		controls,
		initialState: window.myJetpackInitialState || {},
	} );
}

export { STORE_ID, initStore };

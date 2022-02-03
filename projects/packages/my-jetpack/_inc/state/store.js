/**
 * Internal dependencies
 */
import actions from './actions';
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
		__experimentalUseThunks: true, // never stop experiment :sweat_smile:
		reducer,
		actions,
		selectors,
		resolvers,
		controls,
		initialState: window.myJetpackInitialState || {},
	} );
}

export { STORE_ID, initStore };

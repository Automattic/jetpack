import actions from './actions';
import controls from './controls';
import reducer from './reducers';
import resolvers from './resolvers';
import selectors from './selectors';
import storeHolder from './store-holder';

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

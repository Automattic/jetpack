import reducer from './reducers';
import storeHolder from './store-holder';

const STORE_ID = 'my-jetpack';

/**
 * Inits redux store for my-jetpack
 */
function initStore() {
	storeHolder.mayBeInit( STORE_ID, {
		__experimentalUseThunks: true, // never stop experiment :sweat_smile:
		reducer,
		initialState: window.myJetpackInitialState || {},
	} );
}

export { STORE_ID, initStore };

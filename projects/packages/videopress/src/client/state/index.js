/**
 * External dependencies
 */
import debugFactory from 'debug';
/**
 * Internal dependencies
 */
import actions from './actions';
import reducer from './reducers';
import resolvers from './resolvers';
import selectors from './selectors';
import storeHolder from './store-holder';

/**
 * External dependencies
 */
const STORE_ID = 'jetpack-videopress';
const debug = debugFactory( 'jetpack-videopress:state' );

/**
 * jetpack-videopress redux initializer
 */
function initStore() {
	debug( 'Initializing %o store', STORE_ID );

	storeHolder.mayBeInit( STORE_ID, {
		__experimentalUseThunks: true,
		reducer,
		actions,
		selectors,
		resolvers,
		initialState: window.myJetpackInitialState || {},
	} );
}

export { STORE_ID, initStore };

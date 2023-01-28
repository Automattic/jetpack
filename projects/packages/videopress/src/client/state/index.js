/**
 * External dependencies
 */
import debugFactory from 'debug';
/**
 * Internal dependencies
 */
import actions from './actions';
import { STORE_ID } from './constants';
import reducer from './reducers';
import resolvers from './resolvers';
import selectors from './selectors';
import storeHolder from './store-holder';

/**
 * External dependencies
 */
export const stateDebug = debugFactory( 'videopress/media:state' );

const initialState = window.jetpackVideoPressInitialState?.initialState || { videos: {} };

const hashPieces = window.location.hash.split( '?' );

if ( hashPieces?.[ 0 ] === '#/' && hashPieces?.[ 1 ] && hashPieces?.[ 1 ] !== 'page=1' ) {
	// Avoid flash of initial data when we have a query on the main library page (#/), different from a page=1 query
	initialState.videos.isFetching = true;
}

/**
 * jetpack-videopress redux initializer
 */
function initStore() {
	stateDebug( 'Initializing %o store', STORE_ID );

	storeHolder.mayBeInit( STORE_ID, {
		__experimentalUseThunks: true,
		reducer,
		actions,
		selectors,
		resolvers,
		initialState,
	} );
}

export { STORE_ID, initStore };

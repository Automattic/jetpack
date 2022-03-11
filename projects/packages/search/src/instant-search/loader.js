// NOTE: This must be imported first before any other imports.
// See: https://github.com/webpack/webpack/issues/2776#issuecomment-233208623
import './set-webpack-public-path';

/**
 * Internal dependencies
 */
import { SERVER_OBJECT_NAME } from './lib/constants';
import { bindCustomizerChanges } from './lib/customize';

/**
 * Loads and runs the main chunk for Instant Search.
 */
function init() {
	import( /* webpackChunkName: "jp-search.chunk-main-payload" */ './index' ).then( instantSearch =>
		instantSearch.initialize()
	);
}

// Bind customizer changes immediately.
if ( window[ SERVER_OBJECT_NAME ] ) {
	bindCustomizerChanges();
}

// Initialize Instant Search when DOMContentLoaded is fired, or immediately if it already has been.
if ( document.readyState !== 'loading' ) {
	init();
} else {
	document.addEventListener( 'DOMContentLoaded', init );
}

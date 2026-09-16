/**
 * Entry point for the Jetpack AI admin page.
 *
 * Mounts the React app into the #jetpack-ai-root div rendered by Jetpack_AI_Page::page_render().
 */

// Must run before any module that can trigger a chunk load.
import './ai/public-path';
import apiFetch from '@wordpress/api-fetch';
import * as WPElement from '@wordpress/element';
import analytics from 'lib/analytics';
import App from './ai/main';
import './ai/style.scss';

const { apiRoot, apiNonce, tracksUserData } = window?.jetpackAiSettings ?? {};

// Identify the connected user so Tracks events aren't anonymous.
if ( tracksUserData?.userid && tracksUserData?.username ) {
	analytics.initialize( tracksUserData.userid, tracksUserData.username );
}

if ( apiRoot ) {
	apiFetch.use( apiFetch.createRootURLMiddleware( apiRoot ) );
}
if ( apiNonce ) {
	apiFetch.use( apiFetch.createNonceMiddleware( apiNonce ) );
}

/**
 * Mount the React app into the page root element.
 */
function render() {
	const container = document.getElementById( 'jetpack-ai-root' );
	if ( ! container ) {
		return;
	}

	container.jetpackAiRoot ??= WPElement.createRoot( container );
	container.jetpackAiRoot.render( <App /> );
}

render();

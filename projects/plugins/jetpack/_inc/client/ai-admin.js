/**
 * Entry point for the Jetpack AI admin page.
 *
 * Mounts the React app into the #jetpack-ai-root div rendered by Jetpack_AI_Page::page_render().
 */

import apiFetch from '@wordpress/api-fetch';
import * as WPElement from '@wordpress/element';
import App from './ai/main';
import './ai/style.scss';

const { apiRoot, apiNonce } = window?.jetpackAiSettings ?? {};

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
	WPElement.createRoot( container ).render( <App /> );
}

render();

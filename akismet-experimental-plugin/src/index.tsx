// Vendor stylesheets come first — @wordpress/components +
// @wordpress/dataviews chrome (filter toolbar, density / sort menus,
// action menus, modal portal) requires their CSS on the page. Studio's
// WP version doesn't register a `wp-dataviews` style handle, so we
// inline both into our own build via vendor.scss; sass-loader
// resolves the node_modules paths and avoids the tree-shaking issue
// `sideEffects: false` causes on direct JS imports.
import '@/styles/vendor.scss';

import apiFetch from '@wordpress/api-fetch';
import { createRoot } from '@wordpress/element';
import { App } from '@/app';
import { readGlobal } from '@/lib/is-jetpack-active';

// Wire the WordPress REST nonce + root URL into apiFetch before mounting.
// See react-query-conventions.md §9. `createNonceMiddleware` also auto-rotates
// the nonce when the server sends an updated one in the `X-WP-Nonce` response
// header, so no manual refresh handling is needed.
const globals = readGlobal();
if ( globals.apiNonce ) {
	apiFetch.use( apiFetch.createNonceMiddleware( globals.apiNonce ) );
}
if ( globals.apiRoot ) {
	apiFetch.use( apiFetch.createRootURLMiddleware( globals.apiRoot ) );
}

const root = document.getElementById( 'akismet-experimental-app' );
if ( root ) {
	createRoot( root ).render( <App /> );
}

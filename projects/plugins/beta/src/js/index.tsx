/**
 * Entry point for the Jetpack Beta Tester React app.
 *
 * Bootstraps apiFetch middleware from window.JetpackBeta then mounts the app.
 *
 * @package
 */

import apiFetch from '@wordpress/api-fetch';
import { createRoot } from '@wordpress/element';
import App from './app';
import './style.scss';

const boot = window.JetpackBeta;
apiFetch.use( apiFetch.createRootURLMiddleware( boot.apiRoot ) );
apiFetch.use( apiFetch.createNonceMiddleware( boot.apiNonce ) );

const el = document.getElementById( 'jetpack-beta-root' );
if ( el ) {
	createRoot( el ).render( <App /> );
}

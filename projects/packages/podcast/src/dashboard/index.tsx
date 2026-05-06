/**
 * Podcast SPA bootstrap.
 */

import { createRoot } from '@wordpress/element';
import App from './app';
import './style.scss';

const container = document.getElementById( 'jetpack-podcast-root' );
if ( container ) {
	createRoot( container ).render( <App /> );
}

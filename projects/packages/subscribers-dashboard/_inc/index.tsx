import { createRoot } from '@wordpress/element';
import App from './components/app';
import './style.scss';

const container = document.getElementById( 'jetpack-subscribers-dashboard' );

if ( container ) {
	// Belt-and-suspenders: tag the body so our chrome overrides match regardless of which
	// WP-generated body class (toplevel_page_*, jetpack_page_*, users_page_*) the menu lands on.
	document.body.classList.add( 'jetpack-subscribers-dashboard-page' );
	createRoot( container ).render( <App /> );
}

import { createRoot } from '@wordpress/element';
import App from './components/app';

import './style.scss';

/**
 * Mount the WordPress.com ID page app.
 */
function render() {
	const container = document.getElementById( 'wpcom-id-container' );

	if ( ! container ) {
		return;
	}

	createRoot( container ).render( <App /> );
}

render();

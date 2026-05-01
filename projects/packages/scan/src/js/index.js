import * as WPElement from '@wordpress/element';
import App from './admin';

/**
 * Initial render function.
 */
function render() {
	const container = document.getElementById( 'jetpack-scan-page-root' );

	if ( null === container ) {
		return;
	}

	WPElement.createRoot( container ).render( <App /> );
}

render();

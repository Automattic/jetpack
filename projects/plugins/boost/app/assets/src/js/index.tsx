import * as WPElement from '@wordpress/element';
import Main from './main';

/**
 * Initial render function.
 */
function render() {
	const container = document.getElementById( 'jb-admin-settings' );

	if ( null === container ) {
		return;
	}

	const component = <Main />;

	WPElement.createRoot( container ).render( component );
}

render();

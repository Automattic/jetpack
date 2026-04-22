import { createReduxStore, register } from '@wordpress/data';
import * as WPElement from '@wordpress/element';
import App from './admin';
import './style.scss';
import { STORE_ID, storeConfig } from './store';

const store = createReduxStore( STORE_ID, storeConfig );
register( store );

/**
 * Initial render function.
 */
function render() {
	const container = document.getElementById( 'jetpack-backup-root' );

	if ( null === container ) {
		return;
	}

	WPElement.createRoot( container ).render( <App /> );
}

render();

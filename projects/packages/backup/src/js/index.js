import { ThemeProvider } from '@automattic/jetpack-components';
import { createReduxStore, register } from '@wordpress/data';
import * as WPElement from '@wordpress/element';
import React from 'react';
import Admin from './components/Admin';
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

	const component = (
		<ThemeProvider>
			<Admin />
		</ThemeProvider>
	);
	WPElement.createRoot( container ).render( component );
}

render();

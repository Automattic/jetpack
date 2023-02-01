import { ThemeProvider } from '@automattic/jetpack-components';
import { createReduxStore, register } from '@wordpress/data';
import React from 'react';
import ReactDOM from 'react-dom/client';
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

	ReactDOM.createRoot( container ).render(
		<ThemeProvider>
			<Admin />
		</ThemeProvider>
	);
}

render();

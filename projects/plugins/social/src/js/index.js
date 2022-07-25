import { ThemeProvider } from '@automattic/jetpack-components';
import { createReduxStore, register } from '@wordpress/data';
import React from 'react';
import ReactDOM from 'react-dom';
import AdminPage from './components/admin-page';
import { STORE_ID, storeConfig } from './store';

const store = createReduxStore( STORE_ID, storeConfig );
register( store );

/**
 * Initial render function.
 */
function render() {
	const container = document.getElementById( 'jetpack-social-root' );

	if ( null === container ) {
		return;
	}

	ReactDOM.render(
		<ThemeProvider>
			<AdminPage />
		</ThemeProvider>,
		container
	);
}

render();

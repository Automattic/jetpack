/**
 * External dependencies
 */
import React from 'react';
import ReactDOM from 'react-dom';
import { createReduxStore, register } from '@wordpress/data';
import { ThemeProvider } from '@automattic/jetpack-components';

/**
 * Internal dependencies
 */
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

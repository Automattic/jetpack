import { ThemeProvider } from '@automattic/jetpack-components';
import * as WPElement from '@wordpress/element';
import React from 'react';
import AdminPage from './components/admin-page';

/**
 * Initial render function.
 */
function renderApp() {
	const container = document.getElementById( 'automattic-for-agencies-client-root' );

	if ( null === container ) {
		return;
	}

	const component = (
		<ThemeProvider>
			<AdminPage />
		</ThemeProvider>
	);
	WPElement.createRoot( container ).render( component );
}

renderApp();

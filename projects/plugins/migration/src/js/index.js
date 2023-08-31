import { ThemeProvider } from '@automattic/jetpack-components';
import * as WPElement from '@wordpress/element';
import React from 'react';
import AdminPage from './components/admin-page';

/**
 * Initial render function.
 */
function render() {
	const container = document.getElementById( 'wpcom-migration-root' );

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

render();

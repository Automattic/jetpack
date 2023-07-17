import { ThemeProvider } from '@automattic/jetpack-components';
import * as WPElement from '@wordpress/element';
import React from 'react';
import AdminPage from './components/admin-page';

/**
 * Initial render function.
 */
function render() {
	const container = document.getElementById( 'jetpack-chat-root' );

	if ( null === container ) {
		return;
	}

	// @todo: Remove fallback when we drop support for WP 6.1
	const component = (
		<ThemeProvider>
			<AdminPage />
		</ThemeProvider>
	);
	if ( WPElement.createRoot ) {
		WPElement.createRoot( container ).render( component );
	} else {
		WPElement.render( component, container );
	}
}

render();

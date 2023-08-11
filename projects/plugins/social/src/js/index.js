import { ThemeProvider } from '@automattic/jetpack-components';
import { SOCIAL_STORE_ID, SOCIAL_STORE_CONFIG } from '@automattic/jetpack-publicize-components';
import { createReduxStore, register } from '@wordpress/data';
import * as WPElement from '@wordpress/element';
import React from 'react';
import AdminPage from './components/admin-page';
const store = createReduxStore( SOCIAL_STORE_ID, SOCIAL_STORE_CONFIG );
register( store );

/**
 * Initial render function.
 */
function render() {
	const container = document.getElementById( 'jetpack-social-root' );

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

import * as WPElement from '@wordpress/element';
import React from 'react';
import { Provider } from 'react-redux';
import store from 'state/redux-store-minimal';
import PluginDeactivation from './portals/plugin-deactivation';

/**
 * Mount the app to the app node that we include in the footer.
 */
function initPluginsPageApp() {
	const container = document.getElementById( 'jetpack-plugin-portal-app' );

	// @todo: Remove fallback when we drop support for WP 6.1
	const component = (
		<Provider store={ store }>
			<PluginDeactivation />
		</Provider>
	);
	if ( WPElement.createRoot ) {
		WPElement.createRoot( container ).render( component );
	} else {
		WPElement.render( component, container );
	}
}

if ( document.readyState !== 'loading' ) {
	initPluginsPageApp();
} else {
	document.addEventListener( 'DOMContentLoaded', () => {
		initPluginsPageApp();
	} );
}

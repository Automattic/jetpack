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

	const component = (
		<Provider store={ store }>
			<PluginDeactivation />
		</Provider>
	);
	WPElement.createRoot( container ).render( component );
}

if ( document.readyState !== 'loading' ) {
	initPluginsPageApp();
} else {
	document.addEventListener( 'DOMContentLoaded', () => {
		initPluginsPageApp();
	} );
}

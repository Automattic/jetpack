import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import store from 'state/redux-store-minimal';
import PluginDeactivation from './portals/plugin-deactivation';

/**
 * Mount the app to the app node that we include in the footer.
 */
function initPluginsPageApp() {
	const container = document.getElementById( 'jetpack-plugin-portal-app' );

	ReactDOM.createRoot( container ).render(
		<Provider store={ store }>
			<PluginDeactivation />
		</Provider>
	);
}

if ( document.readyState !== 'loading' ) {
	initPluginsPageApp();
} else {
	document.addEventListener( 'DOMContentLoaded', () => {
		initPluginsPageApp();
	} );
}

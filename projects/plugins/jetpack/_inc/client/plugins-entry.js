/**
 * External dependencies
 */
import ReactDOM from 'react-dom';
import React from 'react';
import { Provider } from 'react-redux';

/**
 * Internal dependencies
 */
import store from 'state/redux-store';
import PluginDeactivation from './portals/plugin-deactivation';

/**
 * Mount the app to the app node that we include in the footer.
 */
function initPluginsPageApp() {
	const container = document.getElementById( 'jetpack-plugin-portal-app' );

	ReactDOM.render(
		<Provider store={ store }>
			<PluginDeactivation />
		</Provider>,
		container
	);
}

if ( document.readyState !== 'loading' ) {
	initPluginsPageApp();
} else {
	document.addEventListener( 'DOMContentLoaded', () => {
		initPluginsPageApp();
	} );
}

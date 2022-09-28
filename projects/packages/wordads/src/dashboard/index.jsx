import { ThemeProvider } from '@automattic/jetpack-components';
import { createReduxStore, register } from '@wordpress/data';
import React from 'react';
import ReactDOM from 'react-dom';
import WordAdsDashboard from './components/dashboard';
import { STORE_ID, storeConfig } from './store';

const store = createReduxStore( STORE_ID, storeConfig );
register( store );

/**
 * Mounts the Search Dashboard to #jp-wordads-dashboard if available.
 */
function init() {
	const container = document.getElementById( 'jp-wordads-dashboard' );

	if ( container === null ) {
		return;
	}

	ReactDOM.render(
		<ThemeProvider>
			<WordAdsDashboard />
		</ThemeProvider>,
		container
	);
}

// Initialize the dashboard when DOMContentLoaded is fired, or immediately if it already has been.
if ( document.readyState !== 'loading' ) {
	init();
} else {
	document.addEventListener( 'DOMContentLoaded', init );
}

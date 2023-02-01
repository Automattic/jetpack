import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import store from 'state/redux-store';
import SearchDashboard from './search/dashboard';

/**
 * Mounts the Search Dashboard to #jp-search-dashboard if available.
 */
function init() {
	const container = document.getElementById( 'jp-search-dashboard' );

	if ( container === null ) {
		return;
	}

	ReactDOM.createRoot( container ).render(
		<Provider store={ store }>
			<SearchDashboard />
		</Provider>
	);
}

// Initialize the dashboard when DOMContentLoaded is fired, or immediately if it already has been.
if ( document.readyState !== 'loading' ) {
	init();
} else {
	document.addEventListener( 'DOMContentLoaded', init );
}

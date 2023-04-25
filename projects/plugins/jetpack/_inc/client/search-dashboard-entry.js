import * as WPElement from '@wordpress/element';
import React from 'react';
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

	// @todo: Remove fallback when we drop support for WP 6.1
	const component = (
		<Provider store={ store }>
			<SearchDashboard />
		</Provider>
	);
	if ( WPElement.createRoot ) {
		WPElement.createRoot( container ).render( component );
	} else {
		WPElement.render( component, container );
	}
}

// Initialize the dashboard when DOMContentLoaded is fired, or immediately if it already has been.
if ( document.readyState !== 'loading' ) {
	init();
} else {
	document.addEventListener( 'DOMContentLoaded', init );
}

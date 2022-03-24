/**
 * External dependencies
 */
import ReactDOM from 'react-dom';
import React from 'react';

/**
 * WordPress dependencies
 */
import { createReduxStore, register } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { STORE_ID, storeConfig } from './store';
import WordAdsDashboard from './components/dashboard';

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

	ReactDOM.render( <WordAdsDashboard />, container );
}

// Initialize the dashboard when DOMContentLoaded is fired, or immediately if it already has been.
if ( document.readyState !== 'loading' ) {
	init();
} else {
	document.addEventListener( 'DOMContentLoaded', init );
}

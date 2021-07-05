/**
 * External dependencies
 */
import React from 'react';
import ReactDOM from 'react-dom';
import { registerStore } from '@wordpress/data';

/**
 * Internal dependencies
 */
import Admin from './components/Admin';
import { STORE_ID, storeConfig } from './store';

registerStore( STORE_ID, storeConfig );

/**
 * Initial render function.
 */
function render() {
	const container = document.getElementById( 'jetpack-backup-root' );

	if ( null === container ) {
		return;
	}

	ReactDOM.render( <Admin />, container );
}

render();

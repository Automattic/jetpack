import { createReduxStore, register } from '@wordpress/data';
import React from 'react';
import ReactDOM from 'react-dom';
import Admin from './components/Admin';
import { STORE_ID, storeConfig } from './store';

const store = createReduxStore( STORE_ID, storeConfig );
register( store );

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

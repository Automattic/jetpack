import { createReduxStore, register } from '@wordpress/data';
import React from 'react';
import ReactDOM from 'react-dom';
import Admin from './components/admin';
import { STORE_ID, storeConfig } from './store';

const store = createReduxStore( STORE_ID, storeConfig );
register( store );

/**
 * The initial renderer function.
 */
function render() {
	const container = document.getElementById( 'jetpack-connection-ui-container' );

	if ( null === container ) {
		return;
	}

	ReactDOM.render( <Admin />, container );
}

render();

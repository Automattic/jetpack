/**
 * External dependencies
 */
import React from 'react';
import ReactDOM from 'react-dom';

/**
 * Internal dependencies
 */
import App from './components/App';

/**
 * Initial render function.
 */
function render() {
	const container = document.getElementById( 'backups-root' );

	if ( null === container ) {
		return;
	}

	ReactDOM.render( <App />, container );
}

render();

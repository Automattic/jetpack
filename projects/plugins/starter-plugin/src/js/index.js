import React from 'react';
import ReactDOM from 'react-dom';
import AdminPage from './components/admin-page';

/**
 * Initial render function.
 */
function render() {
	const container = document.getElementById( 'jetpack-starter-plugin-root' );

	if ( null === container ) {
		return;
	}

	ReactDOM.render( <AdminPage />, container );
}

render();

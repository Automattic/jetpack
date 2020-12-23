/**
 * External dependencies
 */
import ReactDOM from 'react-dom';
import React from 'react';
import { registerStore } from '@wordpress/data';
import { Provider } from 'react-redux';

/**
 * Internal dependencies
 */
import Admin from "./components/admin";

/**
 * The initial renderer function.
 */
function render() {
	const container = document.getElementById( 'jetpack-connection-ui-container' );

	if ( null === container ) {
		return;
	}

	const reducer = function ( state = {}, action ) {
		return state;
	};

	ReactDOM.render(
		<div>
			<Provider store={ registerStore( 'jetpack-connection-ui', { reducer } ) }>
				<Admin />
			</Provider>
		</div>,
		container
	);
}

render();

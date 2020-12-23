/**
 * External dependencies
 */
import ReactDOM from 'react-dom';
import React from 'react';
import { registerStore } from '@wordpress/data';
import { Provider } from 'react-redux';

/**
 * The initial renderer function.
 */
function render() {
	const container = document.getElementById( 'jetpack-connection-ui-container' );

	const reducer = function ( state = {}, action ) {
		return state;
	};

	ReactDOM.render(
		<div>
			<Provider store={ registerStore( 'jetpack-connection-ui', { reducer } ) } />
			Hello World 🌍
		</div>,
		container
	);
}

render();

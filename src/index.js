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
	const container = document.getElementById( 'jp-plugin-container' );

	ReactDOM.render(
		<div>
			<Provider store={ registerStore( 'jetpack-store', {} ) } />
		</div>,
		container
	);
}

render();

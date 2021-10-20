/**
 * External dependencies
 */
import ReactDOM from 'react-dom';
import React from 'react';

/**
 * Internal dependencies
 */
import MyJetpack from './components/my-jetpack';

/**
 * The initial renderer function.
 */
function render() {
	const container = document.getElementById( 'my-jetpack-container' );

	if ( null === container ) {
		return;
	}

	ReactDOM.render( <MyJetpack />, container );
}

render();

/**
 * External dependencies
 */
import ReactDOM from 'react-dom';
import React from 'react';

/**
 * Internal dependencies
 */
import MyJetpackScreen from './components/my-jetpack-screen';
import { initStore } from './state/store';

initStore();

/**
 * The initial renderer function.
 */
function render() {
	const container = document.getElementById( 'my-jetpack-container' );

	if ( null === container ) {
		return;
	}

	ReactDOM.render( <MyJetpackScreen />, container );
}

render();

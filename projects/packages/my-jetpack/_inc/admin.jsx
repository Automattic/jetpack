/**
 * External dependencies
 */
import ReactDOM from 'react-dom';
import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';

/**
 * Internal dependencies
 */
import MyJetpackScreen from './components/my-jetpack-screen';
import ConnectionScreen from './components/connection-screen';
import { initStore } from './state/store';
import { BoostInterstitial } from './components/product-interstitial';

initStore();

/**
 * The initial renderer function.
 */
function render() {
	const container = document.getElementById( 'my-jetpack-container' );

	if ( null === container ) {
		return;
	}

	ReactDOM.render(
		<HashRouter>
			<Routes>
				<Route path="/" element={ <MyJetpackScreen /> } />
				<Route path="/connection" element={ <ConnectionScreen /> } />
				<Route path="/add-boost" element={ <BoostInterstitial /> } />
			</Routes>
		</HashRouter>,
		container
	);
}

render();

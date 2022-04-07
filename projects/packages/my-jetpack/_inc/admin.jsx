/**
 * External dependencies
 */
import ReactDOM from 'react-dom';
import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@automattic/jetpack-components';

/**
 * Internal dependencies
 */
import MyJetpackScreen from './components/my-jetpack-screen';
import ConnectionScreen from './components/connection-screen';
import { initStore } from './state/store';
import ProductInterstitial from './components/product-interstitial';
import './style.module.scss';

initStore();

const MyJetpack = () => (
	<ThemeProvider>
		<HashRouter>
			<Routes>
				<Route path="/" element={ <MyJetpackScreen /> } />
				<Route path="/connection" element={ <ConnectionScreen /> } />
				<Route path="/add-anti-spam" element={ <ProductInterstitial slug="anti-spam" /> } />
				<Route path="/add-backup" element={ <ProductInterstitial slug="backup" /> } />
				<Route path="/add-boost" element={ <ProductInterstitial slug="boost" /> } />
				<Route path="/add-crm" element={ <ProductInterstitial slug="crm" /> } />
				<Route path="/add-extras" element={ <ProductInterstitial slug="extras" /> } />
				<Route path="/add-scan" element={ <ProductInterstitial slug="scan" /> } />
				<Route path="/add-search" element={ <ProductInterstitial slug="search" /> } />
				<Route path="/add-videopress" element={ <ProductInterstitial slug="videopress" /> } />
			</Routes>
		</HashRouter>
	</ThemeProvider>
);

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

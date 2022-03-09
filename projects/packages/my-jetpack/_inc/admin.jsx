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
import {
	AntiSpamInterstitial,
	BackupInterstitial,
	BoostInterstitial,
	CRMInterstitial,
	ExtrasInterstitial,
	ScanInterstitial,
	SearchInterstitial,
	VideoPressInterstitial,
} from './components/product-interstitial';
import './style.module.scss';

initStore();

const MyJetpack = () => (
	<HashRouter>
		<Routes>
			<Route path="/" element={ <MyJetpackScreen /> } />
			<Route path="/connection" element={ <ConnectionScreen /> } />
			<Route path="/add-anti-spam" element={ <AntiSpamInterstitial /> } />
			<Route path="/add-backup" element={ <BackupInterstitial /> } />
			<Route path="/add-boost" element={ <BoostInterstitial /> } />
			<Route path="/add-crm" element={ <CRMInterstitial /> } />
			<Route path="/add-extras" element={ <ExtrasInterstitial /> } />
			<Route path="/add-scan" element={ <ScanInterstitial /> } />
			<Route path="/add-search" element={ <SearchInterstitial /> } />
			<Route path="/add-videopress" element={ <VideoPressInterstitial /> } />
		</Routes>
	</HashRouter>
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

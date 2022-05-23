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
import {
	AntiSpamInterstitial,
	BackupInterstitial,
	BoostInterstitial,
	CRMInterstitial,
	ExtrasInterstitial,
	ScanInterstitial,
	SocialInterstitial,
	SearchInterstitial,
	VideoPressInterstitial,
} from './components/product-interstitial';
import AddLicenseScreen from './components/add-license-screen';
import './style.module.scss';

initStore();

const MyJetpack = () => (
	<ThemeProvider>
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
				<Route path="/add-social" element={ <SocialInterstitial /> } />
				<Route path="/add-search" element={ <SearchInterstitial /> } />
				<Route path="/add-videopress" element={ <VideoPressInterstitial /> } />
				{ window?.myJetpackInitialState?.loadAddLicenseScreen && (
					<Route path="/add-license" element={ <AddLicenseScreen /> } />
				) }
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

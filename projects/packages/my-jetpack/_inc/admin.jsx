/**
 * External dependencies
 */
import { ThemeProvider } from '@automattic/jetpack-components';
import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
/**
 * Internal dependencies
 */
import AddLicenseScreen from './components/add-license-screen';
import ConnectionScreen from './components/connection-screen';
import MyJetpackScreen from './components/my-jetpack-screen';
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
import { initStore } from './state/store';
import './style.module.scss';

initStore();

/**
 * Component to scroll window to top on route change.
 *
 * @returns {null} Null.
 */
function ScrollToTop() {
	const location = useLocation();
	useEffect( () => window.scrollTo( 0, 0 ), [ location ] );

	return null;
}

const MyJetpack = () => (
	<ThemeProvider>
		<HashRouter>
			<ScrollToTop />
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

/**
 * External dependencies
 */
import { ThemeProvider } from '@automattic/jetpack-components';
import * as WPElement from '@wordpress/element';
import React, { useEffect } from 'react';
import { HashRouter, Navigate, Routes, Route, useLocation } from 'react-router-dom';
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
	CreatorInterstitial,
	ExtrasInterstitial,
	JetpackAIInterstitial,
	ProtectInterstitial,
	ScanInterstitial,
	SocialInterstitial,
	SearchInterstitial,
	VideoPressInterstitial,
	StatsInterstitial,
} from './components/product-interstitial';
import RedeemTokenScreen from './components/redeem-token-screen';
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
				<Route path="/add-akismet" element={ <AntiSpamInterstitial /> } />
				{ /* Redirect the old route for Anti Spam */ }
				<Route path="/add-anti-spam" element={ <Navigate replace to="/add-akismet" /> } />
				<Route path="/add-backup" element={ <BackupInterstitial /> } />
				<Route path="/add-boost" element={ <BoostInterstitial /> } />
				<Route path="/add-crm" element={ <CRMInterstitial /> } />
				<Route path="/add-creator" element={ <CreatorInterstitial /> } />
				<Route path="/add-jetpack-ai" element={ <JetpackAIInterstitial /> } />
				<Route path="/add-extras" element={ <ExtrasInterstitial /> } />
				<Route path="/add-protect" element={ <ProtectInterstitial /> } />
				<Route path="/add-scan" element={ <ScanInterstitial /> } />
				<Route path="/add-social" element={ <SocialInterstitial /> } />
				<Route path="/add-search" element={ <SearchInterstitial /> } />
				<Route path="/add-videopress" element={ <VideoPressInterstitial /> } />
				<Route path="/add-stats" element={ <StatsInterstitial /> } />
				{ window?.myJetpackInitialState?.loadAddLicenseScreen && (
					<Route path="/add-license" element={ <AddLicenseScreen /> } />
				) }
				<Route path="/redeem-token" element={ <RedeemTokenScreen /> } />
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

	WPElement.createRoot( container ).render( <MyJetpack /> );
}

render();

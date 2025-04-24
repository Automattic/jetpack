/**
 * External dependencies
 */
import React, { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter, Navigate, Routes, Route, useLocation } from 'react-router-dom';
/**
 * Internal dependencies
 */
import AddLicenseScreen from './components/add-license-screen';
import ConnectionScreen from './components/connection-screen';
import MyJetpackScreen from './components/my-jetpack-screen';
import OnboardingScreen from './components/onboarding-screen';
import {
	AntiSpamInterstitial,
	BackupInterstitial,
	BoostInterstitial,
	CRMInterstitial,
	ExtrasInterstitial,
	JetpackAiInterstitial,
	ProtectInterstitial,
	ScanInterstitial,
	SocialInterstitial,
	SearchInterstitial,
	VideoPressInterstitial,
	StatsInterstitial,
	SecurityInterstitial,
	GrowthInterstitial,
	CompleteInterstitial,
} from './components/product-interstitial';
import JetpackAiProductPage from './components/product-interstitial/jetpack-ai/product-page';
import RedeemTokenScreen from './components/redeem-token-screen';
import WoaOnboardingScreen from './components/woa-onboarding-screen';
import { MyJetpackRoutes } from './constants';
import { getMyJetpackWindowInitialState } from './data/utils/get-my-jetpack-window-state';
import Providers from './providers';
import './style.module.scss';

/**
 * Component to scroll window to top on route change.
 *
 * @return {null} Null.
 */
function ScrollToTop() {
	const location = useLocation();
	useEffect( () => window.scrollTo( 0, 0 ), [ location ] );

	return null;
}

const MyJetpack = () => {
	const { loadAddLicenseScreen } = getMyJetpackWindowInitialState();
	const container = document.getElementById( 'my-jetpack-container' );
	const routeParam = container?.dataset?.route;
	const isOnboarding = routeParam === 'onboarding' || routeParam === 'woa-onboarding';

	// If we're on the onboarding route, render the appropriate onboarding screen
	if ( isOnboarding ) {
		// For WoA sites, use the WoA-specific onboarding screen
		const OnboardComponent =
			routeParam === 'woa-onboarding' ? WoaOnboardingScreen : OnboardingScreen;
		return (
			<Providers>
				<OnboardComponent />
			</Providers>
		);
	}

	// Otherwise render the normal hash router with all other routes
	return (
		<Providers>
			<HashRouter>
				<ScrollToTop />
				<Routes>
					<Route path={ MyJetpackRoutes.Home } element={ <MyJetpackScreen /> } />
					<Route path={ MyJetpackRoutes.Connection } element={ <ConnectionScreen /> } />
					<Route path={ MyJetpackRoutes.AddAkismet } element={ <AntiSpamInterstitial /> } />
					{ /* Redirect the old route for Anti Spam */ }
					<Route
						path={ MyJetpackRoutes.AddAntiSpam }
						element={ <Navigate replace to={ MyJetpackRoutes.AddAkismet } /> }
					/>
					<Route path={ MyJetpackRoutes.AddBackup } element={ <BackupInterstitial /> } />
					<Route path={ MyJetpackRoutes.AddBoost } element={ <BoostInterstitial /> } />
					<Route path={ MyJetpackRoutes.AddCRM } element={ <CRMInterstitial /> } />
					<Route path={ MyJetpackRoutes.AddJetpackAI } element={ <JetpackAiInterstitial /> } />
					<Route path={ MyJetpackRoutes.AddExtras } element={ <ExtrasInterstitial /> } />
					<Route path={ MyJetpackRoutes.AddProtect } element={ <ProtectInterstitial /> } />
					<Route path={ MyJetpackRoutes.AddScan } element={ <ScanInterstitial /> } />
					<Route path={ MyJetpackRoutes.AddSocial } element={ <SocialInterstitial /> } />
					<Route path={ MyJetpackRoutes.AddSearch } element={ <SearchInterstitial /> } />
					<Route path={ MyJetpackRoutes.AddVideoPress } element={ <VideoPressInterstitial /> } />
					<Route path={ MyJetpackRoutes.AddStats } element={ <StatsInterstitial /> } />
					{ loadAddLicenseScreen && (
						<Route path={ MyJetpackRoutes.AddLicense } element={ <AddLicenseScreen /> } />
					) }
					<Route path={ MyJetpackRoutes.JetpackAi } element={ <JetpackAiProductPage /> } />
					<Route path={ MyJetpackRoutes.AddSecurity } element={ <SecurityInterstitial /> } />
					<Route path={ MyJetpackRoutes.AddGrowth } element={ <GrowthInterstitial /> } />
					<Route path={ MyJetpackRoutes.AddComplete } element={ <CompleteInterstitial /> } />
					<Route path={ MyJetpackRoutes.RedeemToken } element={ <RedeemTokenScreen /> } />
					{ /* Fallback route. Required to prevent visiting `?page=my-jetpack#wpbody-content` from raising an exception. */ }
					<Route path="*" element={ <Navigate replace to={ MyJetpackRoutes.Home } /> } />
				</Routes>
			</HashRouter>
		</Providers>
	);
};

/**
 * The initial renderer function.
 */
function render() {
	const container = document.getElementById( 'my-jetpack-container' );
	if ( null === container ) {
		return;
	}

	createRoot( container ).render( <MyJetpack /> );
}

render();

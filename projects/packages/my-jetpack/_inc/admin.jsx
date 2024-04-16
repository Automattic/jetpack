/**
 * External dependencies
 */
import { ThemeProvider } from '@automattic/jetpack-components';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createRoot } from '@wordpress/element';
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
	JetpackAiInterstitial,
	ProtectInterstitial,
	ScanInterstitial,
	SocialInterstitial,
	SearchInterstitial,
	VideoPressInterstitial,
	StatsInterstitial,
} from './components/product-interstitial';
import JetpackAiProductPage from './components/product-interstitial/jetpack-ai/product-page';
import RedeemTokenScreen from './components/redeem-token-screen';
import { MyJetpackRoutes } from './constants';
import NoticeContextProvider from './context/notices/noticeContext';
import { getMyJetpackWindowInitialState } from './data/utils/get-my-jetpack-window-state';
import './style.module.scss';

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

const MyJetpack = () => {
	const queryClient = new QueryClient();
	const { loadAddLicenseScreen } = getMyJetpackWindowInitialState();

	return (
		<ThemeProvider>
			<NoticeContextProvider>
				<QueryClientProvider client={ queryClient }>
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
							<Route path={ MyJetpackRoutes.AddCreator } element={ <CreatorInterstitial /> } />
							<Route path={ MyJetpackRoutes.AddJetpackAI } element={ <JetpackAiInterstitial /> } />
							<Route path={ MyJetpackRoutes.AddExtras } element={ <ExtrasInterstitial /> } />
							<Route path={ MyJetpackRoutes.AddProtect } element={ <ProtectInterstitial /> } />
							<Route path={ MyJetpackRoutes.AddScan } element={ <ScanInterstitial /> } />
							<Route path={ MyJetpackRoutes.AddSocial } element={ <SocialInterstitial /> } />
							<Route path={ MyJetpackRoutes.AddSearch } element={ <SearchInterstitial /> } />
							<Route
								path={ MyJetpackRoutes.AddVideoPress }
								element={ <VideoPressInterstitial /> }
							/>
							<Route path={ MyJetpackRoutes.AddStats } element={ <StatsInterstitial /> } />
							{ loadAddLicenseScreen && (
								<Route path={ MyJetpackRoutes.AddLicense } element={ <AddLicenseScreen /> } />
							) }
							<Route path={ MyJetpackRoutes.RedeemToken } element={ <RedeemTokenScreen /> } />
							<Route path="/redeem-token" element={ <RedeemTokenScreen /> } />
							<Route path="/jetpack-ai" element={ <JetpackAiProductPage /> } />
						</Routes>
					</HashRouter>
				</QueryClientProvider>
			</NoticeContextProvider>
		</ThemeProvider>
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

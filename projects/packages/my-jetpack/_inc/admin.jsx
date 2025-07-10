/**
 * External dependencies
 */
import jetpackAnalytics from '@automattic/jetpack-analytics';
import { createRoot } from '@wordpress/element';
import { useEffect } from 'react';
import { HashRouter, Navigate, Routes, Route, useLocation } from 'react-router';
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
import { MyJetpackRoutes } from './constants';
import { getMyJetpackWindowInitialState } from './data/utils/get-my-jetpack-window-state';
import './style.module.scss';
import Providers from './providers';

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
	const isOnboarding = container?.dataset?.route === 'onboarding';

	// If we're on the onboarding route, render just the onboarding screen
	if ( isOnboarding ) {
		return (
			<Providers>
				<OnboardingScreen />
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
					<Route path="*" element={ <MyJetpackScreen /> } />
				</Routes>
			</HashRouter>
		</Providers>
	);
};

/**
 * Initialize JPJSErrorTracker for error monitoring
 */
function initializeErrorTracker() {
	if ( typeof window.JPJSErrorTracker === 'function' ) {
		window.myJetpackErrorTracker = new window.JPJSErrorTracker( error => {
			// Add My Jetpack context to errors
			error.context = 'my-jetpack';
			error.route = window.location.hash;

			// Send to Jetpack Analytics
			try {
				// Prepare error data for analytics
				const errorProperties = {
					error_message: error.message ? error.message.substring( 0, 100 ) : 'No message',
					error_filename: error.filename || 'unknown',
					error_lineno: error.lineno || 0,
					error_colno: error.colno || 0,
					error_route: error.route || window.location.hash || 'none',
					error_user_agent: navigator.userAgent.substring( 0, 100 ),
					error_viewport_width: window.innerWidth,
					error_viewport_height: window.innerHeight,
				};

				// Record error event
				jetpackAnalytics.tracks.recordEvent( 'jetpack_my_jetpack_js_error', errorProperties );
			} catch ( analyticsError ) {
				// eslint-disable-next-line no-console
				console.error( 'Failed to send error to analytics:', analyticsError );
			}
		} );
	}
}

/**
 * The initial renderer function.
 */
function render() {
	const container = document.getElementById( 'my-jetpack-container' );
	if ( null === container ) {
		return;
	}

	// Initialize error tracking before React app
	initializeErrorTracker();

	createRoot( container ).render( <MyJetpack /> );
}

render();

/**
 * External dependencies
 */
import { useEffect } from 'react';
import { HashRouter, Navigate, Routes, Route, useLocation } from 'react-router';
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
import ProtectProductPage from './components/product-interstitial/protect/product-page';
import RedeemTokenScreen from './components/redeem-token-screen';
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
	useEffect( () => {
		window.scrollTo( 0, 0 );
	}, [ location ] );

	return null;
}

/**
 * The My Jetpack app tree, shared by the legacy entry and the wp-build stage.
 *
 * @return {object} The App component.
 */
export default function App() {
	const { loadAddLicenseScreen } = getMyJetpackWindowInitialState();

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
					<Route path={ MyJetpackRoutes.ProtectDetails } element={ <ProtectProductPage /> } />
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
}

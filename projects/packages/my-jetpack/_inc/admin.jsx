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
	SearchInterstitial,
	VideoPressInterstitial,
} from './components/product-interstitial';
import './style.module.scss';
import { ActivationScreen } from '@automattic/jetpack-licensing';

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
				<Route path="/add-search" element={ <SearchInterstitial /> } />
				<Route path="/add-videopress" element={ <VideoPressInterstitial /> } />
				<Route
					path="/license/activation"
					element={
						<ActivationScreen
							assetBaseUrl={ this.props.pluginBaseUrl }
							lockImage="/images/jetpack-license-activation-with-lock.png"
							siteRawUrl={ this.props.siteRawUrl }
							successImage="/images/jetpack-license-activation-with-success.png"
							onActivationSuccess={ this.onLicenseActivationSuccess }
							siteAdminUrl={ this.props.siteAdminUrl }
							currentRecommendationsStep={ this.props.currentRecommendationsStep }
						/>
					}
				/>
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

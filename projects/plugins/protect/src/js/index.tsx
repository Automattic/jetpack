import { ThemeProvider } from '@automattic/jetpack-components';
import * as WPElement from '@wordpress/element';
import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Modal from './components/modal';
import { OnboardingRenderedContextProvider } from './hooks/use-onboarding';
import FirewallRoute from './routes/firewall';
import ScanRoute from './routes/scan';
import ScanHistoryRoute from './routes/scan/history';
import { initStore } from './state/store';
import './styles.module.scss';

// Initialize Jetpack Protect store
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

/**
 * Initial render function.
 */
function render() {
	const container = document.getElementById( 'jetpack-protect-root' );

	if ( null === container ) {
		return;
	}

	const component = (
		<ThemeProvider>
			<OnboardingRenderedContextProvider value={ { renderedSteps: [] } }>
				<HashRouter>
					<ScrollToTop />
					<Routes>
						<Route path="/scan" element={ <ScanRoute /> } />
						<Route path="/scan/history" element={ <ScanHistoryRoute /> } />
						<Route path="/scan/history/:filter" element={ <ScanHistoryRoute /> } />
						<Route path="/firewall" element={ <FirewallRoute /> } />
						<Route path="*" element={ <Navigate to="/scan" replace /> } />
					</Routes>
				</HashRouter>
				<Modal />
			</OnboardingRenderedContextProvider>
		</ThemeProvider>
	);
	WPElement.createRoot( container ).render( component );
}

render();

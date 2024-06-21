import { ThemeProvider } from '@automattic/jetpack-components';
import * as WPElement from '@wordpress/element';
import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import FirewallPage from './components/firewall-page';
import Modal from './components/modal';
import ScanPage from './components/scan-page';
import { OnboardingRenderedContextProvider } from './hooks/use-onboarding';
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
						<Route path="/" element={ <ScanPage /> } />
						<Route path="/firewall" element={ <FirewallPage /> } />
					</Routes>
				</HashRouter>
				<Modal />
			</OnboardingRenderedContextProvider>
		</ThemeProvider>
	);
	WPElement.createRoot( container ).render( component );
}

render();

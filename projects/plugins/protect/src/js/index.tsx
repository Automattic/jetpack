import { ThemeProvider } from '@automattic/jetpack-components';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import * as WPElement from '@wordpress/element';
import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Modal from './components/modal';
import PaidPlanGate from './components/paid-plan-gate';
import { ModalProvider } from './hooks/use-modal';
import { NoticeProvider } from './hooks/use-notices';
import { OnboardingRenderedContextProvider } from './hooks/use-onboarding';
import { CheckoutProvider } from './hooks/use-plan';
import FirewallRoute from './routes/firewall';
import ScanRoute from './routes/scan';
import ScanHistoryRoute from './routes/scan/history';
import SettingsRoute from './routes/settings';
import SetupRoute from './routes/setup';
import './styles.module.scss';

const queryClient = new QueryClient( {
	defaultOptions: {
		queries: {
			staleTime: Infinity,
		},
	},
} );

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

/**
 * Initial render function.
 */
function render() {
	const container = document.getElementById( 'jetpack-protect-root' );

	if ( null === container ) {
		return;
	}

	const component = (
		<QueryClientProvider client={ queryClient }>
			<ThemeProvider>
				<NoticeProvider>
					<ModalProvider>
						<CheckoutProvider>
							<OnboardingRenderedContextProvider>
								<HashRouter>
									<ScrollToTop />
									<Routes>
										<Route path="/settings" element={ <SettingsRoute /> } />
										<Route path="/setup" element={ <SetupRoute /> } />
										<Route path="/scan" element={ <ScanRoute /> } />
										<Route
											path="/scan/history"
											element={
												<PaidPlanGate>
													<ScanHistoryRoute />
												</PaidPlanGate>
											}
										/>
										<Route
											path="/scan/history/:filter"
											element={
												<PaidPlanGate>
													<ScanHistoryRoute />
												</PaidPlanGate>
											}
										/>
										<Route path="/firewall" element={ <FirewallRoute /> } />
										<Route path="*" element={ <Navigate to="/scan" replace /> } />
									</Routes>
								</HashRouter>
								<Modal />
							</OnboardingRenderedContextProvider>
						</CheckoutProvider>
					</ModalProvider>
				</NoticeProvider>
			</ThemeProvider>
			<ReactQueryDevtools initialIsOpen={ false } />
		</QueryClientProvider>
	);
	WPElement.createRoot( container ).render( component );
}

render();

import { ThemeProvider } from '@automattic/jetpack-components';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as WPElement from '@wordpress/element';
import { useEffect } from 'react';
import { HashRouter, Routes, Route, useLocation, Navigate } from 'react-router';
import Modal from './components/modal';
import PaidPlanGate from './components/paid-plan-gate';
import ProtectApp from './components/protect-app';
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
	useEffect( () => {
		window.scrollTo( 0, 0 );
	}, [ location ] );

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
										<Route path="/setup" element={ <SetupRoute /> } />
										<Route path="/*" element={ <ProtectApp /> }>
											<Route path="scan" element={ <ScanRoute /> } />
											<Route
												path="scan/history"
												element={
													<PaidPlanGate>
														<ScanHistoryRoute />
													</PaidPlanGate>
												}
											/>
											<Route
												path="scan/history/:filter"
												element={
													<PaidPlanGate>
														<ScanHistoryRoute />
													</PaidPlanGate>
												}
											/>
											<Route path="firewall" element={ <FirewallRoute /> } />
											<Route path="settings" element={ <SettingsRoute /> } />
											<Route path="*" element={ <Navigate to="/scan" replace /> } />
										</Route>
									</Routes>
								</HashRouter>
								<Modal />
							</OnboardingRenderedContextProvider>
						</CheckoutProvider>
					</ModalProvider>
				</NoticeProvider>
			</ThemeProvider>
		</QueryClientProvider>
	);
	WPElement.createRoot( container ).render( component );
}

render();

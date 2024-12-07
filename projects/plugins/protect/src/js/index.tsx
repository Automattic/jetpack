import { ThemeProvider } from '@automattic/jetpack-components';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import * as WPElement from '@wordpress/element';
import { useEffect } from 'react';
import { HashRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Modal from './components/modal';
import PaidPlanGate from './components/paid-plan-gate';
import { ModalProvider } from './hooks/use-modal';
import { NoticeProvider } from './hooks/use-notices';
import { OnboardingRenderedContextProvider } from './hooks/use-onboarding';
import { CheckoutProvider } from './hooks/use-plan';
import FirewallRoute from './routes/firewall';
import HomeRoute from './routes/home';
import ScanRoute from './routes/scan';
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
										<Route path="/setup" element={ <SetupRoute /> } />
										<Route path="/" element={ <HomeRoute /> } />
										<Route path="/scan" element={ <ScanRoute /> } />
										<Route
											path="/scan/history"
											element={
												<PaidPlanGate>
													<ScanRoute />
												</PaidPlanGate>
											}
										/>
										<Route
											path="/scan/history/:filter"
											element={
												<PaidPlanGate>
													<ScanRoute />
												</PaidPlanGate>
											}
										/>
										<Route path="/firewall" element={ <FirewallRoute /> } />
										<Route path="*" element={ <Navigate to="/" replace /> } />
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

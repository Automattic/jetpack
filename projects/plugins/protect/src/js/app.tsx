import { useQueries } from '@tanstack/react-query';
import { useEffect } from 'react';
import { HashRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import PaidPlanGate from './components/paid-plan-gate';
import { ACCOUNT_PROTECTION_QUERY } from './data/account-protection/use-account-protection-query';
import { HISTORY_QUERY } from './data/scan/use-history-query';
import { SCAN_STATUS_QUERY } from './data/scan/use-scan-status-query';
import { CREDENTIALS_QUERY } from './data/use-credentials-query';
import { HAS_PLAN_QUERY } from './data/use-has-plan-query';
import { WAF_QUERY } from './data/waf/use-waf-query';
import FirewallRoute from './routes/firewall';
import ScanRoute from './routes/scan';
import ScanHistoryRoute from './routes/scan/history';
import SettingsRoute from './routes/settings';
import SetupRoute from './routes/setup';
import './styles.module.scss';

/**
 * Component to scroll window to top on route change.
 *
 * @return {null} Null.
 */
function ScrollToTop(): null {
	const location = useLocation();
	useEffect( () => window.scrollTo( 0, 0 ), [ location ] );

	return null;
}

/**
 * App
 *
 * @return {JSX.Element} The main application component.
 */
export default function App(): JSX.Element {
	/**
	 * Mount all queries at the top level of the application.
	 * This is necessary to ensure queries using initialData can be invalidated prior to their first use.
	 */
	useQueries( {
		queries: [
			ACCOUNT_PROTECTION_QUERY,
			CREDENTIALS_QUERY,
			HAS_PLAN_QUERY,
			HISTORY_QUERY,
			SCAN_STATUS_QUERY,
			WAF_QUERY,
		],
	} );

	return (
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
	);
}

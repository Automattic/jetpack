/**
 * External dependencies
 */
import {
	AnalyticsQueryClientProvider,
	PeriodChangeSignalProvider,
	ReportScopeProvider,
} from '@jetpack-premium-analytics/data';
import { StatsErrorBoundary } from '@jetpack-premium-analytics/error-reporting';
import { useParams } from '@wordpress/route';
/**
 * Internal dependencies
 */
import { READY_SUMMARY, ReportPage } from './components';
import { route } from './package.json';
import { getSingleReportAdapter, type SingleReportAdapter } from './pages';
import { getSingleReportPage } from './registry';
import type { JSX } from 'react';

const ROUTE_FROM = route.path;

// A page the route ships no adapter for renders from its record: the label titles it.
const RECORD_ADAPTER: SingleReportAdapter = {
	useSummary: () => READY_SUMMARY,
	headerSlots: ( summary, { title } ) => ( { title } ),
};

/**
 * Resolves the page the URL names and its adapter, then renders the page.
 *
 * @return The page, or nothing for a page the guard already rejected.
 */
function SingleReport(): JSX.Element | null {
	const { kind, id } = useParams( { from: ROUTE_FROM } ) as { kind?: string; id?: string };
	const page = getSingleReportPage( kind );

	if ( ! page || ! id ) {
		// The route guard already sent an unknown page or id to the dashboard.
		return null;
	}

	return (
		<ReportPage
			// Another page is another adapter, so another hook order: remount.
			key={ page.path }
			routeFrom={ ROUTE_FROM }
			page={ page }
			entityId={ id }
			reportsPage={ page.reports_page ?? undefined }
			adapter={ getSingleReportAdapter( page ) ?? RECORD_ADAPTER }
		/>
	);
}

/**
 * The route's stage.
 *
 * @return The single-report page with its providers.
 */
export function stage(): JSX.Element {
	return (
		<StatsErrorBoundary>
			<AnalyticsQueryClientProvider>
				{ /* No compared period on this page, whatever a hand-edited URL carries. */ }
				<ReportScopeProvider offersComparison={ false }>
					<PeriodChangeSignalProvider>
						<SingleReport />
					</PeriodChangeSignalProvider>
				</ReportScopeProvider>
			</AnalyticsQueryClientProvider>
		</StatsErrorBoundary>
	);
}

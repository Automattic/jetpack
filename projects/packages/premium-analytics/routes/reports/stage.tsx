/**
 * External dependencies
 */
import {
	AnalyticsQueryClientProvider,
	isPlanDateLimitedSection,
	isStatsFeatureLocked,
	PeriodChangeSignalProvider,
	ReportScopeProvider,
} from '@jetpack-premium-analytics/data';
import { StatsErrorBoundary } from '@jetpack-premium-analytics/error-reporting';
import { ChartsProvider } from '@jetpack-premium-analytics/widgets-toolkit';
import { useParams } from '@wordpress/route';
/**
 * Internal dependencies
 */
import { useDateWindowNotice } from '../date-window-notice';
// The page of widgets a registered reports page renders is the single-report page's, without an entity.
import { READY_SUMMARY, ReportPage } from '../single-report/components';
import { useStatsDateLimits } from '../use-stats-date-limits';
import { LockedReportPage } from './locked-report-page';
import { route } from './package.json';
import { getReportDefinition, getReportsPage } from './registry';
import { getReportPage } from './report-pages';
import type { SingleReportAdapter } from '../single-report/pages';
import type { ReportPageRecord } from '../single-report/registry';
import type { JSX, ReactNode } from 'react';

const ROUTE_FROM = route.path;

// A reports page waits on no entity: the open section heads it, else its own label.
const REPORTS_PAGE_ADAPTER: SingleReportAdapter = {
	useSummary: () => READY_SUMMARY,
	headerSlots: ( summary, { label, section } ) => ( {
		title: section?.label ?? section?.section.label ?? label,
	} ),
};

/**
 * Dispatcher for the `/reports/$report` route.
 *
 * Page chrome (header, tabs, widget grid) belongs to each report's own
 * component; this carries no report-specific logic.
 *
 * @return {JSX.Element} The report page.
 */
function ReportDispatcher(): JSX.Element | null {
	const { report } = useParams( { from: ROUTE_FROM } ) as { report?: string };

	const definition = getReportDefinition( report );
	const lockedFeature =
		definition?.feature && isStatsFeatureLocked( definition.feature ) ? definition.feature : null;

	// The report's page is never rendered, so neither are its requests.
	if ( definition && lockedFeature ) {
		return <LockedReportPage label={ definition.getLabel() } feature={ lockedFeature } />;
	}

	const BundledPage = definition ? getReportPage( definition.id ) : undefined;

	if ( ! BundledPage ) {
		// Unreachable: beforeLoad guarantees a valid report before this renders.
		return null;
	}

	return <BundledPage key={ report } />;
}

/**
 * The report surface's provider stack, mounted once so no report page mounts its
 * own.
 *
 * @param {object}    props          - The component props.
 * @param {ReactNode} props.children - The report page.
 * @return {JSX.Element} The wrapped report page.
 */
function ReportProviders( { children }: { children: ReactNode } ): JSX.Element {
	const { report } = useParams( { from: ROUTE_FROM } ) as { report?: string };
	const definition = getReportDefinition( report );
	const { dateLimits } = useStatsDateLimits(
		isPlanDateLimitedSection( definition?.dashboardSection )
	);
	useDateWindowNotice();

	return (
		<AnalyticsQueryClientProvider>
			<ChartsProvider>
				{ /*
				 * A report names no compared period, so nothing below may fetch or
				 * draw one. The params stay on the URL for the dashboard.
				 */ }
				<ReportScopeProvider offersComparison={ false } dateLimits={ dateLimits }>
					{ children }
				</ReportScopeProvider>
			</ChartsProvider>
		</AnalyticsQueryClientProvider>
	);
}

type RegisteredReportsPageProps = {
	/*
	 * The registered reports page the URL names.
	 */
	page: ReportPageRecord;
};

/**
 * A registered reports page: the widgets its record declares, with the page's own providers.
 *
 * @param {RegisteredReportsPageProps} props - The props.
 * @return {JSX.Element} The reports page.
 */
function RegisteredReportsPage( { page }: RegisteredReportsPageProps ): JSX.Element {
	return (
		<AnalyticsQueryClientProvider>
			{ /* No compared period on this page, whatever a hand-edited URL carries. */ }
			<ReportScopeProvider offersComparison={ false }>
				<PeriodChangeSignalProvider>
					<ReportPage
						key={ page.path }
						routeFrom={ ROUTE_FROM }
						page={ page }
						adapter={ REPORTS_PAGE_ADAPTER }
					/>
				</PeriodChangeSignalProvider>
			</ReportScopeProvider>
		</AnalyticsQueryClientProvider>
	);
}

/**
 * Picks what the URL's report renders: a registered reports page, or a bundled report's page.
 *
 * @return {JSX.Element} The report page.
 */
function Report(): JSX.Element {
	const { report } = useParams( { from: ROUTE_FROM } ) as { report?: string };

	const definition = getReportDefinition( report );
	const page = definition ? getReportsPage( definition.id ) : undefined;
	const isLocked = !! definition?.feature && isStatsFeatureLocked( definition.feature );

	// A locked report shows its upsell in place of its page, whichever kind it is.
	if ( page && ! isLocked ) {
		return <RegisteredReportsPage page={ page } />;
	}

	return (
		<ReportProviders>
			<ReportDispatcher />
		</ReportProviders>
	);
}

/**
 * Premium Analytics dynamic report page stage.
 *
 * @return {JSX.Element} The report page.
 */
export function stage(): JSX.Element {
	return (
		<StatsErrorBoundary>
			<Report />
		</StatsErrorBoundary>
	);
}

/**
 * External dependencies
 */
import {
	AnalyticsQueryClientProvider,
	isPlanDateLimitedSection,
	isStatsFeatureLocked,
	ReportScopeProvider,
} from '@jetpack-premium-analytics/data';
import { StatsErrorBoundary } from '@jetpack-premium-analytics/error-reporting';
import { ChartsProvider } from '@jetpack-premium-analytics/widgets-toolkit';
import { useParams } from '@wordpress/route';
/**
 * Internal dependencies
 */
import { useDateWindowNotice } from '../date-window-notice';
import { useStatsDateLimits } from '../use-stats-date-limits';
import { LockedReportPage } from './locked-report-page';
import { route } from './package.json';
import { getReportDefinition } from './registry';
import { getReportPage } from './report-pages';
import type { JSX, ReactNode } from 'react';

const ROUTE_FROM = route.path;

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

	const ReportPage = definition ? getReportPage( definition.id ) : undefined;

	if ( ! ReportPage ) {
		// Unreachable: beforeLoad guarantees a valid report before this renders.
		return null;
	}

	return <ReportPage key={ report } />;
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

/**
 * Premium Analytics dynamic report page stage.
 *
 * @return {JSX.Element} The report page.
 */
export function stage(): JSX.Element {
	return (
		<StatsErrorBoundary>
			<ReportProviders>
				<ReportDispatcher />
			</ReportProviders>
		</StatsErrorBoundary>
	);
}

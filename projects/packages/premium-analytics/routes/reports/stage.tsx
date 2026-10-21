/**
 * External dependencies
 */
import {
	AnalyticsQueryClientProvider,
	isPlanDateLimitedSection,
	isStatsFeatureLocked,
	ReportScopeProvider,
} from '@jetpack-premium-analytics/data';
import { Stack } from '@jetpack-premium-analytics/externals';
import { ChartsProvider } from '@jetpack-premium-analytics/widgets-toolkit';
import { Spinner } from '@wordpress/components';
import { lazy, Suspense, useMemo } from '@wordpress/element';
import { useParams } from '@wordpress/route';
/**
 * Internal dependencies
 */
import { useDateWindowNotice } from '../date-window-notice';
import { useStatsDateLimits } from '../use-stats-date-limits';
import { LockedReportPage } from './locked-report-page';
import { route } from './package.json';
import { getReportDefinition } from './registry';
import styles from './stage.module.scss';
import type { JSX, ReactNode } from 'react';

const ROUTE_FROM = route.path;

/**
 * Centered loading fallback shown while a report's page module loads.
 *
 * @return {JSX.Element} The loading state.
 */
function ReportLoading(): JSX.Element {
	return (
		<Stack justify="center" align="center" className={ styles.loading }>
			<Spinner />
		</Stack>
	);
}

/**
 * Dispatcher for the `/reports/$report` route.
 *
 * Page chrome (header, tabs, widget grid) belongs to each report's own
 * component; this carries no report-specific logic.
 *
 * @return {JSX.Element} The report page.
 */
function ReportDispatcher(): JSX.Element {
	const { report } = useParams( { from: ROUTE_FROM } ) as { report?: string };

	const definition = getReportDefinition( report );
	const lockedFeature =
		definition?.feature && isStatsFeatureLocked( definition.feature ) ? definition.feature : null;

	// `React.lazy` memoizes by component identity, so a fresh `lazy()` per definition is what
	// lets switching reports mount a different page; `key` below makes the remount explicit.
	const LazyReport = useMemo(
		() => ( definition && ! lockedFeature ? lazy( definition.load ) : null ),
		[ definition, lockedFeature ]
	);

	// The report's page is never loaded, so neither are its requests.
	if ( definition && lockedFeature ) {
		return <LockedReportPage label={ definition.getLabel() } feature={ lockedFeature } />;
	}

	if ( ! LazyReport ) {
		// Unreachable: beforeLoad guarantees a valid report before this renders.
		return <ReportLoading />;
	}

	return (
		<Suspense fallback={ <ReportLoading /> }>
			<LazyReport key={ report } />
		</Suspense>
	);
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
		<ReportProviders>
			<ReportDispatcher />
		</ReportProviders>
	);
}

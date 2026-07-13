/**
 * External dependencies
 */
import { AnalyticsQueryClientProvider, GlobalErrorProvider } from '@jetpack-premium-analytics/data';
import { GlobalChartsProvider, useChartTheme } from '@jetpack-premium-analytics/widgets-toolkit';
import { Spinner } from '@wordpress/components';
import { lazy, Suspense, useMemo } from '@wordpress/element';
import { useParams } from '@wordpress/route';
import { Stack } from '@wordpress/ui';
/**
 * Internal dependencies
 */
import { route } from './package.json';
import { getReportDefinition } from './registry';
import styles from './stage.module.scss';
import type { ReactNode } from 'react';

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
 * Reads the `$report` path param, looks up the report definition in the
 * registry, and renders that report's page component lazily. It carries no
 * report-specific logic — page chrome (header, tabs, widget grid) belongs to
 * each report's own component.
 *
 * `route.ts`'s `beforeLoad` validates `$report` against the registry and
 * redirects unknown or missing reports to the dashboard, so a definition is
 * guaranteed to exist by the time this renders. The empty-definition branch
 * below only satisfies the type; it should never be reached at runtime.
 *
 * @return {JSX.Element} The report page.
 */
function ReportDispatcher(): JSX.Element {
	const { report } = useParams( { from: ROUTE_FROM } ) as { report?: string };

	const definition = getReportDefinition( report );

	// Recreate the lazy component whenever the report id changes so each report
	// loads its own page module. `React.lazy` memoizes the resolved component by
	// its own identity, so a fresh `lazy()` per definition is what lets a switch
	// mount a different report; keying the element by id below makes the remount
	// explicit rather than relying on that identity change alone.
	const LazyReport = useMemo(
		() => ( definition ? lazy( definition.load ) : null ),
		[ definition ]
	);

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
 * The report surface's provider stack, mounted once here so every report page
 * composes data hooks and chart components directly (`useSeriesStyles` +
 * `ComparativeLineChart`, same as widgets) without mounting its own providers.
 *
 * @param {object}    props          - The component props.
 * @param {ReactNode} props.children - The report page.
 * @return {JSX.Element} The wrapped report page.
 */
function ReportProviders( { children }: { children: ReactNode } ): JSX.Element {
	const chartTheme = useChartTheme();

	return (
		<AnalyticsQueryClientProvider>
			<GlobalErrorProvider>
				<GlobalChartsProvider theme={ chartTheme }>{ children }</GlobalChartsProvider>
			</GlobalErrorProvider>
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

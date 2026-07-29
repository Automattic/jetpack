/**
 * External dependencies
 */
import {
	normalizeReportParams,
	type IntervalType,
	type StatsChartBucketPeriod,
	type StatsVideoPlaysItem,
} from '@jetpack-premium-analytics/data';
import { useDashboardLink, useReportDateFilters } from '@jetpack-premium-analytics/routing';
import { DateFiltersPanel } from '@jetpack-premium-analytics/ui';
import {
	formatLegendLabels,
	ReportErrorState,
	ReportPageLayout,
	ReportPageShell,
	ReportPerformanceChart,
	ReportRecordsTable,
	useReportRetry,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { Breadcrumbs } from '@wordpress/admin-ui';
import { useCallback, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useNavigate, useSearch } from '@wordpress/route';
/**
 * Internal dependencies
 */
import { route } from '../package.json';
import { getVideoRowId, getVideosFields, useVideosReportRecords } from './config';

const ROUTE_FROM = route.path;
const REPORT_PARAMS = { report: 'videos' };
const CHART_PERIODS = [
	'day',
	'week',
	'month',
] as const satisfies readonly StatsChartBucketPeriod[];
type ChartPeriod = ( typeof CHART_PERIODS )[ number ];

/**
 * Whether a value is one of the chart bucket periods this report offers.
 *
 * @param value - The candidate value (e.g. from the URL search).
 * @return Whether the value is a chart period.
 */
function isChartPeriod( value: unknown ): value is ChartPeriod {
	return CHART_PERIODS.includes( value as ChartPeriod );
}

/**
 * Choose the chart bucket period for a report interval.
 *
 * @param interval - The report date interval.
 * @return The default chart bucket period.
 */
function getDefaultChartPeriod( interval?: IntervalType ): ChartPeriod {
	if ( interval === 'week' ) {
		return 'week';
	}

	if ( interval === 'month' || interval === 'quarter' || interval === 'year' ) {
		return 'month';
	}

	return 'day';
}

const RECORDS_VIEW = {
	sort: { field: 'plays', direction: 'desc' as const },
	layout: {
		styles: {
			label: { width: '100%' },
			plays: { align: 'end' as const },
			impressions: { align: 'end' as const },
		},
	},
};

/**
 * Premium Analytics Videos report page.
 *
 * @return The Videos report page.
 */
function VideosReport(): JSX.Element {
	const search = useSearch( { from: ROUTE_FROM } ) as Record< string, string | undefined >;
	const reportParams = useMemo(
		() => normalizeReportParams( search as Parameters< typeof normalizeReportParams >[ 0 ] ),
		[ search ]
	);
	const chartPeriod = isChartPeriod( search.period )
		? search.period
		: getDefaultChartPeriod( reportParams.interval );
	const records = useVideosReportRecords( reportParams, chartPeriod );
	const retry = useReportRetry( records.refetch );
	const fields = useMemo( () => getVideosFields(), [] );
	const chartMetrics = useMemo(
		() => [ { key: 'plays', label: __( 'Plays', 'jetpack-premium-analytics-pkg' ) } ],
		[]
	);
	const chartLegendLabels = useMemo( () => formatLegendLabels( reportParams ), [ reportParams ] );

	const navigate = useNavigate();
	const handleIntervalChange = useCallback(
		( interval: IntervalType ) => {
			const period = isChartPeriod( interval ) ? interval : getDefaultChartPeriod( interval );
			navigate( {
				to: ROUTE_FROM,
				params: REPORT_PARAMS as unknown as never,
				replace: true,
				search: ( ( current: Record< string, unknown > ) => ( {
					...current,
					period,
				} ) ) as unknown as never,
			} );
		},
		[ navigate ]
	);

	const dateFilters = useReportDateFilters( ROUTE_FROM );
	const dashboardLink = useDashboardLink();

	return (
		<ReportPageShell
			breadcrumbs={
				<Breadcrumbs
					items={ [
						{
							label: __( 'Stats', 'jetpack-premium-analytics-pkg' ),
							to: dashboardLink,
						},
						{ label: __( 'Videos', 'jetpack-premium-analytics-pkg' ) },
					] }
				/>
			}
			subTitle={ __( 'See how your videos perform.', 'jetpack-premium-analytics-pkg' ) }
		>
			<ReportPageLayout filters={ <DateFiltersPanel { ...dateFilters } /> }>
				{ records.isError ? (
					<ReportErrorState
						title={ __( 'Unable to load videos', 'jetpack-premium-analytics-pkg' ) }
						onRetry={ retry }
					/>
				) : (
					<>
						<ReportPerformanceChart
							primary={ records.chart.primary }
							comparison={ records.chart.comparison }
							isLoading={ records.chart.isLoading }
							metrics={ chartMetrics }
							interval={ chartPeriod }
							onIntervalChange={ handleIntervalChange }
							legendLabels={ chartLegendLabels }
						/>
						<ReportRecordsTable< StatsVideoPlaysItem >
							data={ records.rows }
							fields={ fields }
							getItemId={ getVideoRowId }
							isLoading={ records.isLoading }
							initialView={ RECORDS_VIEW }
							searchLabel={ __( 'Search videos', 'jetpack-premium-analytics-pkg' ) }
						/>
					</>
				) }
			</ReportPageLayout>
		</ReportPageShell>
	);
}

/**
 * Videos report page (default export for the report registry).
 *
 * @return The Videos report page.
 */
export default function VideosReportPage(): JSX.Element {
	return <VideosReport />;
}

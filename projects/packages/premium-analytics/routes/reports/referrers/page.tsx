/**
 * External dependencies
 */
import {
	normalizeReportParams,
	type IntervalType,
	type StatsChartBucketPeriod,
} from '@jetpack-premium-analytics/data';
import { useDashboardLink, useReportDateFilters } from '@jetpack-premium-analytics/routing';
import { DateFiltersPanel } from '@jetpack-premium-analytics/ui';
import {
	formatLegendLabels,
	ReportPageLayout,
	ReportPerformanceChart,
	ReportRecordsTable,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { Breadcrumbs, Page } from '@wordpress/admin-ui';
import { useCallback, useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useNavigate, useSearch } from '@wordpress/route';
/**
 * Internal dependencies
 */
import { route } from '../package.json';
import { getReferrerFields, useReferrersReportRecords, type ReferrerRecord } from './config';
import styles from './page.module.css';

const ROUTE_FROM = route.path;
const REPORT_PARAMS = { report: 'referrers' };
const CHART_PERIODS = [
	'day',
	'week',
	'month',
] as const satisfies readonly StatsChartBucketPeriod[];

/**
 * Check whether a URL value is a supported chart period.
 *
 * @param value - The URL search value.
 * @return Whether the value is a chart period.
 */
function isChartPeriod( value: unknown ): value is StatsChartBucketPeriod {
	return CHART_PERIODS.includes( value as StatsChartBucketPeriod );
}

/**
 * Choose the chart bucket period for a report interval.
 *
 * @param interval - The report date interval.
 * @return The default chart bucket period.
 */
function getDefaultChartPeriod( interval?: IntervalType ): StatsChartBucketPeriod {
	if ( interval === 'week' ) {
		return 'week';
	}

	if ( interval === 'month' || interval === 'quarter' || interval === 'year' ) {
		return 'month';
	}

	return 'day';
}

/**
 * Stable row id for the Referrers records table.
 *
 * @param item - The referrer row.
 * @return The row id.
 */
function getReferrerRowId( item: ReferrerRecord ): string {
	return item.id;
}

const RECORDS_VIEW = {
	sort: { field: 'views', direction: 'desc' as const },
	layout: {
		styles: {
			referrer: { width: '100%' },
			views: { align: 'end' as const },
		},
	},
};

/**
 * Premium Analytics Referrers report page component.
 *
 * @return {JSX.Element} The Referrers report page.
 */
function ReferrersReport(): JSX.Element {
	const search = useSearch( { from: ROUTE_FROM } ) as Record< string, string | undefined >;
	const reportParams = useMemo(
		() => normalizeReportParams( search as Parameters< typeof normalizeReportParams >[ 0 ] ),
		[ search ]
	);

	const chartPeriod = isChartPeriod( search.period )
		? search.period
		: getDefaultChartPeriod( reportParams.interval );
	const records = useReferrersReportRecords( reportParams, chartPeriod );
	const fields = useMemo( () => getReferrerFields(), [] );
	const chartMetrics = useMemo(
		() => [ { key: 'views', label: __( 'Views', 'jetpack-premium-analytics' ) } ],
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
	const [ containerElement, setContainerElement ] = useState< HTMLDivElement | null >( null );

	return (
		<Page
			breadcrumbs={
				<Breadcrumbs
					items={ [
						{
							label: __( 'Stats', 'jetpack-premium-analytics' ),
							to: dashboardLink,
						},
						{ label: __( 'Referrers', 'jetpack-premium-analytics' ) },
					] }
				/>
			}
			className={ styles.page }
		>
			<div className={ styles.content }>
				<ReportPageLayout
					filters={
						<div ref={ setContainerElement } className={ styles.dateFilters }>
							<DateFiltersPanel { ...dateFilters } containerElement={ containerElement } />
						</div>
					}
				>
					<ReportPerformanceChart
						primary={ records.chart.primary }
						comparison={ records.chart.comparison }
						isLoading={ records.chart.isLoading }
						metrics={ chartMetrics }
						interval={ chartPeriod }
						onIntervalChange={ handleIntervalChange }
						legendLabels={ chartLegendLabels }
					/>
					<ReportRecordsTable
						data={ records.rows }
						fields={ fields }
						getItemId={ getReferrerRowId }
						isLoading={ records.isLoading }
						initialView={ RECORDS_VIEW }
						searchLabel={ __( 'Search referrers', 'jetpack-premium-analytics' ) }
					/>
				</ReportPageLayout>
			</div>
		</Page>
	);
}

/**
 * Referrers report page (default export for the report registry).
 *
 * @return {JSX.Element} The Referrers report page.
 */
export default function ReferrersReportPage(): JSX.Element {
	return <ReferrersReport />;
}

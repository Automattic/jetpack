/**
 * External dependencies
 */
import {
	normalizeReportParams,
	type IntervalType,
	type StatsFileDownloadsItem,
	type StatsPeriod,
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
import { getDownloadsFields, useDownloadsReportRecords } from './config';
import styles from './page.module.css';

const ROUTE_FROM = route.path;
const REPORT_PARAMS = { report: 'downloads' };
const CHART_PERIODS = [ 'day', 'week', 'month' ] as const satisfies readonly StatsPeriod[];
type ChartPeriod = ( typeof CHART_PERIODS )[ number ];

/**
 * Check whether a URL value is a supported chart period.
 *
 * @param value - URL search value.
 * @return Whether the value is a chart period.
 */
function isChartPeriod( value: unknown ): value is ChartPeriod {
	return CHART_PERIODS.includes( value as ChartPeriod );
}

/**
 * Choose the chart bucket period for a report interval.
 *
 * @param interval - Report date interval.
 * @return The default chart period.
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

/**
 * Stable table row identity for a downloaded file.
 *
 * @param item - File-download row.
 * @return The row identity.
 */
function getDownloadRowId( item: StatsFileDownloadsItem ): string {
	return item.link ?? String( item.label ?? item.shortLabel ?? '' );
}

const RECORDS_VIEW = {
	sort: { field: 'downloads', direction: 'desc' as const },
	layout: {
		styles: {
			file: { width: '100%' },
			downloads: { align: 'end' as const },
		},
	},
};

/**
 * File downloads report page.
 *
 * @return The rendered report page.
 */
function DownloadsReport(): JSX.Element {
	const search = useSearch( { from: ROUTE_FROM } ) as Record< string, string | undefined >;
	const reportParams = useMemo(
		() => normalizeReportParams( search as Parameters< typeof normalizeReportParams >[ 0 ] ),
		[ search ]
	);
	const chartPeriod = isChartPeriod( search.period )
		? search.period
		: getDefaultChartPeriod( reportParams.interval );
	const records = useDownloadsReportRecords( reportParams, chartPeriod );
	const fields = useMemo( () => getDownloadsFields(), [] );
	const chartMetrics = useMemo(
		() => [ { key: 'downloads', label: __( 'Downloads', 'jetpack-premium-analytics' ) } ],
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
						{ label: __( 'Stats', 'jetpack-premium-analytics' ), to: dashboardLink },
						{ label: __( 'File downloads', 'jetpack-premium-analytics' ) },
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
					<ReportRecordsTable< StatsFileDownloadsItem >
						data={ records.rows }
						fields={ fields }
						getItemId={ getDownloadRowId }
						isLoading={ records.isLoading }
						initialView={ RECORDS_VIEW }
						searchLabel={ __( 'Search files', 'jetpack-premium-analytics' ) }
					/>
				</ReportPageLayout>
			</div>
		</Page>
	);
}

/**
 * File downloads report page (default export for the report registry).
 *
 * @return The rendered report page.
 */
export default function DownloadsReportPage(): JSX.Element {
	return <DownloadsReport />;
}

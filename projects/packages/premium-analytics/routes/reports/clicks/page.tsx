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
	ReportDrilldownTable,
	ReportErrorState,
	ReportPageLayout,
	ReportPageShell,
	ReportPerformanceChart,
	RowsCsvDownloadButton,
	useReportCsvExport,
	useReportRetry,
	type CsvColumn,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { Breadcrumbs } from '@wordpress/admin-ui';
import { useCallback, useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useNavigate, useSearch } from '@wordpress/route';
/**
 * Internal dependencies
 */
import { route } from '../package.json';
import { getClicksFields, useClicksReportRecords, type ClickRow } from './config';

const ROUTE_FROM = route.path;
const REPORT_PARAMS = { report: 'clicks' };
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
 * Stable row id for the Clicks records table.
 *
 * @param item - The clicked URL row.
 * @return The row id.
 */
function getClickRowId( item: ClickRow ): string {
	return item.id;
}

/**
 * Resolve the click-group parent row id for nested URL rows.
 *
 * @param item - The clicked URL row.
 * @return The parent row id, if any.
 */
function getClickRowParentId( item: ClickRow ): string | undefined {
	return item.parentId;
}

/*
 * No default sort: the aggregated rows arrive pre-ordered by clicks (groups,
 * then each group's URLs), and the unsorted view preserves that order. Sorting
 * a field reorders rows within each hierarchy level.
 */
const RECORDS_VIEW = {
	layout: {
		styles: {
			clickedUrl: { width: '100%' },
			clicks: { align: 'end' as const },
		},
	},
};

type ClickCsvRow = ClickRow & { group: string };

/**
 * Recover the source group encoded in a flat click row's id.
 *
 * Nested leaf rows expose the group directly as their parent id. A group with
 * only one URL stays flat, so its id retains the original `group|url` key.
 *
 * @param row - The click row to export.
 * @return The source click group.
 */
function getClickCsvGroup( row: ClickRow ): string {
	if ( row.parentId ) {
		return row.parentId;
	}

	const urlSuffix = row.href ? `|${ row.href }` : '';
	return urlSuffix && row.id.endsWith( urlSuffix )
		? row.id.slice( 0, -urlSuffix.length )
		: '';
}

const sortClickCsvRows = ( a: ClickCsvRow, b: ClickCsvRow ) => b.clicks - a.clicks;

/**
 * Premium Analytics Clicks report page component.
 *
 * @return The Clicks report page.
 */
function ClicksReport(): JSX.Element {
	const search = useSearch( { from: ROUTE_FROM } ) as Record< string, string | undefined >;
	const reportParams = useMemo(
		() => normalizeReportParams( search as Parameters< typeof normalizeReportParams >[ 0 ] ),
		[ search ]
	);

	const chartPeriod = isChartPeriod( search.period )
		? search.period
		: getDefaultChartPeriod( reportParams.interval );
	const records = useClicksReportRecords( reportParams, chartPeriod );
	const retry = useReportRetry( records.refetch );
	const fields = useMemo( () => getClicksFields(), [] );
	const csvRows = useMemo< ClickCsvRow[] >(
		() =>
			records.rows
				.filter( row => ! row.isGroup )
				.map( row => ( { ...row, group: getClickCsvGroup( row ) } ) ),
		[ records.rows ]
	);
	const csvColumns = useMemo< CsvColumn< ClickCsvRow >[] >(
		() => [
			{
				label: __( 'Clicked URL', 'jetpack-premium-analytics' ),
				getValue: row => row.clickedUrl,
			},
			{ label: __( 'Group', 'jetpack-premium-analytics' ), getValue: row => row.group },
			{ label: __( 'Clicks', 'jetpack-premium-analytics' ), getValue: row => row.clicks },
		],
		[]
	);
	const { canExport, buttonProps } = useReportCsvExport( {
		columns: csvColumns,
		rows: csvRows,
		filenamePrefix: 'clicks',
		range: reportParams,
		status: records,
		sort: sortClickCsvRows,
	} );
	const chartMetrics = useMemo(
		() => [ { key: 'clicks', label: __( 'Clicks', 'jetpack-premium-analytics' ) } ],
		[]
	);
	const chartLegendLabels = useMemo( () => formatLegendLabels( reportParams ), [ reportParams ] );

	const navigate = useNavigate();
	const handleIntervalChange = useCallback(
		( interval: IntervalType ) => {
			const period = isChartPeriod( interval ) ? interval : getDefaultChartPeriod( interval );
			navigate( {
				to: ROUTE_FROM,
				/*
				 * The router is built dynamically, so `/reports/$report` has no
				 * statically-typed params/search schema (tanstack widens them to
				 * `never`). Cast the same way the routing package does when it
				 * writes the URL.
				 */
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
		<ReportPageShell
			breadcrumbs={
				<Breadcrumbs
					items={ [
						{
							label: __( 'Stats', 'jetpack-premium-analytics' ),
							to: dashboardLink,
						},
						{ label: __( 'Clicks', 'jetpack-premium-analytics' ) },
					] }
				/>
			}
			actions={
				canExport ? (
					<RowsCsvDownloadButton
						label={ __( 'Download', 'jetpack-premium-analytics' ) }
						variant="solid"
						showIcon={ false }
						{ ...buttonProps }
					/>
				) : undefined
			}
		>
			<ReportPageLayout
				filters={
					<div ref={ setContainerElement }>
						<DateFiltersPanel { ...dateFilters } containerElement={ containerElement } />
					</div>
				}
			>
				{ records.isError ? (
					<ReportErrorState
						title={ __( 'Unable to load clicks', 'jetpack-premium-analytics' ) }
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
						<ReportDrilldownTable< ClickRow >
							data={ records.rows }
							fields={ fields }
							getItemId={ getClickRowId }
							getItemParentId={ getClickRowParentId }
							isLoading={ records.isLoading }
							initialView={ RECORDS_VIEW }
							searchLabel={ __( 'Search clicked URLs', 'jetpack-premium-analytics' ) }
							hideLevelMarkers
						/>
					</>
				) }
			</ReportPageLayout>
		</ReportPageShell>
	);
}

/**
 * Clicks report page (default export for the report registry).
 *
 * @return The Clicks report page.
 */
export default function ClicksReportPage(): JSX.Element {
	return <ClicksReport />;
}

/**
 * External dependencies
 */
import {
	normalizeReportParams,
	type IntervalType,
	type StatsPeriod,
	type StatsTopPostsItem,
} from '@jetpack-premium-analytics/data';
import {
	useDashboardLink,
	useReportDateFilters,
	useSectionTab,
} from '@jetpack-premium-analytics/routing';
import { DateFiltersPanel } from '@jetpack-premium-analytics/ui';
import {
	formatLegendLabels,
	ReportPageLayout,
	ReportPageTabs,
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
import {
	getArchivesFields,
	getPostsFields,
	getReportPostsTabs,
	resolveTabId,
	usePostsReportRecords,
	type ArchiveRow,
} from './config';
import styles from './page.module.css';

// Every report is served by the single dynamic route, so route-level hooks read
// from the shared `/reports/$report` path and navigations target it with the
// `posts` param.
const ROUTE_FROM = route.path;
const REPORT_PARAMS = { report: 'posts' };
const CHART_PERIODS = [ 'day', 'week', 'month' ] as const satisfies readonly StatsPeriod[];
type ChartPeriod = ( typeof CHART_PERIODS )[ number ];

/**
 * Check whether a URL value is a supported chart period.
 *
 * @param value - The URL search value.
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

/**
 * Stable row id for the records table — the post ID, or the label for rows
 * without one (e.g. the home-page/archives row).
 *
 * @param item - The post row.
 * @return The row id.
 */
function getPostRowId( item: StatsTopPostsItem ): string {
	return String( item.id ?? item.label );
}

/**
 * Stable row id for the archives table.
 *
 * @param item - The archive row.
 * @return The row id.
 */
function getArchiveRowId( item: ArchiveRow ): string {
	return item.id;
}

/**
 * Shared initial view for both tabs' records tables: sorted by views, with the
 * title absorbing all spare width so the metric columns shrink to their
 * content and read right-aligned — table-layout auto otherwise stretches an
 * arbitrary column to fill the table.
 */
const RECORDS_VIEW = {
	sort: { field: 'views', direction: 'desc' as const },
	layout: {
		styles: {
			title: { width: '100%' },
			views: { align: 'end' as const },
		},
	},
};

/**
 * Premium Analytics Posts & Pages report page component.
 *
 * The second-level "view all" report for the Posts & Pages traffic module,
 * composed on the shared report-page framework: breadcrumb header, internal
 * Posts & Pages / Archives tabs, the shared date-range + comparison picker,
 * the performance chart, and a Core DataViews table of the active tab's
 * records by views for the selected range. Chart and table derive from the
 * same bucketed report, so the chart shows exactly the records listed below
 * it. Post titles drill into the post/page detail route.
 *
 * @return {JSX.Element} The Posts & Pages report page.
 */
function PostsReport(): JSX.Element {
	// The route guard guarantees the report window params are seeded, so the
	// URL search is the single source of truth for dates, interval, and
	// comparison — resolve it with the same normalizer the widgets use.
	const search = useSearch( { from: ROUTE_FROM } ) as Record< string, string | undefined >;
	const reportParams = useMemo(
		() => normalizeReportParams( search as Parameters< typeof normalizeReportParams >[ 0 ] ),
		[ search ]
	);

	const tabs = useMemo( () => getReportPostsTabs(), [] );
	const [ activeTab, setActiveTab ] = useSectionTab( ROUTE_FROM, resolveTabId );

	const chartPeriod = isChartPeriod( search.period )
		? search.period
		: getDefaultChartPeriod( reportParams.interval );
	const records = usePostsReportRecords( activeTab, reportParams, chartPeriod );

	const postsFields = useMemo( () => getPostsFields(), [] );
	const archivesFields = useMemo( () => getArchivesFields(), [] );

	const chartMetrics = useMemo(
		() => [ { key: 'views', label: __( 'Views', 'jetpack-premium-analytics' ) } ],
		[]
	);
	const chartLegendLabels = useMemo( () => formatLegendLabels( reportParams ), [ reportParams ] );

	// The chart period is part of the report query, so changing it writes the
	// URL (and re-fetches) rather than living in component state.
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

	// Date-range state lives in the URL search params, staged and committed by
	// the shared date-filter controller — same model as the dashboard.
	const dateFilters = useReportDateFilters( ROUTE_FROM );

	// The breadcrumb's "Stats" crumb links back to the dashboard, carrying the
	// current date range and comparison so returning restores the same view.
	const dashboardLink = useDashboardLink();

	// Container element for the date filters panel responsive layout.
	const [ containerElement, setContainerElement ] = useState< HTMLDivElement | null >( null );

	return (
		<Page
			breadcrumbs={
				<Breadcrumbs
					items={ [
						{ label: __( 'Stats', 'jetpack-premium-analytics' ), to: dashboardLink },
						{ label: __( 'Posts & Pages', 'jetpack-premium-analytics' ) },
					] }
				/>
			}
			subTitle={ __( 'All your posts and archive pages.', 'jetpack-premium-analytics' ) }
			className={ styles.page }
		>
			<div className={ styles.content }>
				<ReportPageLayout
					tabs={ <ReportPageTabs tabs={ tabs } value={ activeTab } onChange={ setActiveTab } /> }
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
					{ /*
					 * Keyed by tab so the table's internal view state (sort,
					 * search, page) resets when the records set changes.
					 */ }
					{ activeTab === 'posts-pages' ? (
						<ReportRecordsTable< StatsTopPostsItem >
							key="posts-pages"
							data={ records.posts.rows }
							fields={ postsFields }
							getItemId={ getPostRowId }
							isLoading={ records.posts.isLoading }
							initialView={ RECORDS_VIEW }
							searchLabel={ __( 'Search posts', 'jetpack-premium-analytics' ) }
						/>
					) : (
						<ReportRecordsTable
							key="archives"
							data={ records.archives.rows }
							fields={ archivesFields }
							getItemId={ getArchiveRowId }
							isLoading={ records.archives.isLoading }
							initialView={ RECORDS_VIEW }
							searchLabel={ __( 'Search archives', 'jetpack-premium-analytics' ) }
						/>
					) }
				</ReportPageLayout>
			</div>
		</Page>
	);
}

/**
 * Posts & Pages report page (default export for the report registry).
 *
 * React Query, global errors, and the chart theme are provided by the
 * `/reports/$report` stage, which renders this lazily via the registry's
 * `load` — the page mounts no providers of its own.
 *
 * @return {JSX.Element} The Posts & Pages report page.
 */
export default function PostsReportPage(): JSX.Element {
	return <PostsReport />;
}

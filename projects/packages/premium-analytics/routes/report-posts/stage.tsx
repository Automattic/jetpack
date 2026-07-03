/**
 * External dependencies
 */
import {
	AnalyticsQueryClientProvider,
	GlobalErrorProvider,
	normalizeReportParams,
	useStatsArchives,
	useStatsTopPosts,
	type IntervalType,
	type StatsPeriod,
	type StatsTopPostsItem,
} from '@jetpack-premium-analytics/data';
import { useReportDateFilters } from '@jetpack-premium-analytics/routing';
import { DateFiltersPanel } from '@jetpack-premium-analytics/ui';
import {
	formatLegendLabels,
	ReportPageLayout,
	ReportPerformanceChart,
	ReportRecordsTable,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { Page } from '@wordpress/admin-ui';
import { useCallback, useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useNavigate, useSearch } from '@wordpress/route';
import { StatsBreadcrumbs } from '../post-detail/components';
import { ReportPostsTabs } from './components';
import {
	aggregateArchiveRows,
	aggregatePostRows,
	archivesToTimeSeries,
	getArchivesFields,
	getPostsFields,
	getReportPostsTabs,
	postsToTimeSeries,
	type ArchiveRow,
} from './config';
import { useActiveTab } from './hooks';
import { route } from './package.json';
import styles from './stage.module.scss';

const ROUTE_FROM = route.path;
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
 * Premium Analytics Posts & Pages report page stage component.
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
	const [ activeTab, setActiveTab ] = useActiveTab();

	const chartPeriod = isChartPeriod( search.period )
		? search.period
		: getDefaultChartPeriod( reportParams.interval );

	/*
	 * One bucketed report per tab feeds both the chart and the table (see
	 * `config/aggregate.ts`), so the chart is scoped to exactly the records
	 * shown below it. `summarize: 0` opts out of the data layer's automatic
	 * summarization to get the buckets; `period` comes from the chart control
	 * and is written to the URL. `max: 0` asks for every row so
	 * search/sort/pagination run client-side. Each tab's report only fetches
	 * while its tab is active.
	 */
	const recordsParams = useMemo(
		() => ( { ...reportParams, max: 0, summarize: 0, period: chartPeriod } ),
		[ reportParams, chartPeriod ]
	);
	const posts = useStatsTopPosts( recordsParams, { enabled: activeTab === 'posts-pages' } );
	const archives = useStatsArchives( recordsParams, { enabled: activeTab === 'archives' } );

	const activeReport = activeTab === 'posts-pages' ? posts : archives;

	const chartPrimary = useMemo( () => {
		return activeTab === 'posts-pages'
			? postsToTimeSeries( posts.primary.data )
			: archivesToTimeSeries( archives.primary.data );
	}, [ activeTab, posts.primary.data, archives.primary.data ] );
	const chartComparison = useMemo( () => {
		if ( ! reportParams.compare_from || ! reportParams.compare_to ) {
			return undefined;
		}

		return activeTab === 'posts-pages'
			? postsToTimeSeries( posts.comparison.data )
			: archivesToTimeSeries( archives.comparison.data );
	}, [ activeTab, reportParams, posts.comparison.data, archives.comparison.data ] );

	const postRows = useMemo< StatsTopPostsItem[] >(
		() => aggregatePostRows( posts.primary.data ),
		[ posts.primary.data ]
	);
	const archiveRows = useMemo(
		() => aggregateArchiveRows( archives.primary.data ),
		[ archives.primary.data ]
	);

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

	// Container element for the date filters panel responsive layout.
	const [ containerElement, setContainerElement ] = useState< HTMLDivElement | null >( null );

	return (
		<GlobalErrorProvider>
			<Page
				breadcrumbs={
					<StatsBreadcrumbs title={ __( 'Posts & Pages', 'jetpack-premium-analytics' ) } />
				}
				subTitle={ __( 'All your posts and archive pages.', 'jetpack-premium-analytics' ) }
				className={ styles.page }
			>
				<div className={ styles.content }>
					<ReportPageLayout
						tabs={ <ReportPostsTabs tabs={ tabs } value={ activeTab } onChange={ setActiveTab } /> }
						filters={
							<div ref={ setContainerElement } className={ styles.dateFilters }>
								<DateFiltersPanel { ...dateFilters } containerElement={ containerElement } />
							</div>
						}
					>
						<ReportPerformanceChart
							primary={ chartPrimary }
							comparison={ activeReport.hasComparison ? chartComparison : undefined }
							isLoading={ activeReport.isLoading }
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
								data={ postRows }
								fields={ postsFields }
								getItemId={ getPostRowId }
								isLoading={ posts.isLoading }
								initialView={ RECORDS_VIEW }
								searchLabel={ __( 'Search posts', 'jetpack-premium-analytics' ) }
							/>
						) : (
							<ReportRecordsTable
								key="archives"
								data={ archiveRows }
								fields={ archivesFields }
								getItemId={ getArchiveRowId }
								isLoading={ archives.isLoading }
								initialView={ RECORDS_VIEW }
								searchLabel={ __( 'Search archives', 'jetpack-premium-analytics' ) }
							/>
						) }
					</ReportPageLayout>
				</div>
			</Page>
		</GlobalErrorProvider>
	);
}

/**
 * Route stage wrapper.
 *
 * The chart and table fetch through React Query at the page level, so the page
 * mounts its own AnalyticsQueryClientProvider above the components that read
 * it — same as the post-detail route.
 *
 * @return {JSX.Element} The Posts & Pages report page.
 */
export function stage(): JSX.Element {
	return (
		<AnalyticsQueryClientProvider>
			<PostsReport />
		</AnalyticsQueryClientProvider>
	);
}

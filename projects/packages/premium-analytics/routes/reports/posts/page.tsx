/**
 * External dependencies
 */
import {
	normalizeReportParams,
	type StatsTopPostsComparisonItem,
} from '@jetpack-premium-analytics/data';
import {
	useDashboardLink,
	useReportDateFilters,
	useSectionTab,
} from '@jetpack-premium-analytics/routing';
import { DateFiltersPanel } from '@jetpack-premium-analytics/ui';
import {
	ReportErrorState,
	ReportPageLayout,
	ReportPageShell,
	ReportPageTabs,
	ReportDrilldownTable,
	ReportRecordsTable,
	ReportCsvAction,
	useReportCsvExport,
	useReportRetry,
	type CsvColumn,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { Breadcrumbs } from '@wordpress/admin-ui';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useSearch } from '@wordpress/route';
/**
 * Internal dependencies
 */
import { route } from '../package.json';
import {
	buildArchiveCsvRows,
	getArchivesFields,
	getPostsFields,
	getReportPostsTabs,
	resolveTabId,
	usePostsReportRecords,
	type ArchiveRow,
} from './config';

// Every report is served by the single dynamic route, so route-level hooks read
// from the shared `/reports/$report` path and navigations target it with the
// `posts` param.
const ROUTE_FROM = route.path;

type ReportCsvRow = StatsTopPostsComparisonItem | ArchiveRow;

const sortReportCsvRows = ( a: ReportCsvRow, b: ReportCsvRow ) => b.views - a.views;

/**
 * Stable row id for the records table — the post ID, or the label for rows
 * without one (e.g. the home-page/archives row).
 *
 * @param item - The post row.
 * @return The row id.
 */
function getPostRowId( item: StatsTopPostsComparisonItem ): string {
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
 * Resolve the parent row for DataViews' archives hierarchy.
 *
 * @param item - The archive row.
 * @return The parent row ID, if the row is nested.
 */
function getArchiveRowParentId( item: ArchiveRow ): string | undefined {
	return item.parentId;
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
 * and a Core DataViews table of the active tab's records by views for the
 * selected range. Post titles drill into the post/page detail route.
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

	const records = usePostsReportRecords( activeTab, reportParams );
	const retry = useReportRetry( records.refetch );

	const postsFields = useMemo(
		() => getPostsFields( records.posts.hasComparison ),
		[ records.posts.hasComparison ]
	);
	const archivesFields = useMemo(
		() => getArchivesFields( records.archives.hasComparison ),
		[ records.archives.hasComparison ]
	);

	const csvColumns = useMemo< CsvColumn< ReportCsvRow >[] >(
		() => [
			{
				label: __( 'Title', 'jetpack-premium-analytics-pkg' ),
				getValue: row => String( row.label ?? '' ),
			},
			{ label: __( 'Views', 'jetpack-premium-analytics-pkg' ), getValue: row => row.views },
			{ label: __( 'URL', 'jetpack-premium-analytics-pkg' ), getValue: row => row.link ?? '' },
		],
		[]
	);
	const activeRecords = activeTab === 'posts-pages' ? records.posts : records.archives;

	const csvExportRows = useMemo< ReportCsvRow[] >(
		() =>
			activeTab === 'posts-pages'
				? records.posts.rows
				: buildArchiveCsvRows( records.archives.rows ),
		[ activeTab, records.posts.rows, records.archives.rows ]
	);
	const {
		canExport,
		rows: csvRows,
		filename: csvFilename,
	} = useReportCsvExport< ReportCsvRow >( {
		rows: csvExportRows,
		filenamePrefix: activeTab === 'posts-pages' ? 'top-posts' : 'archives',
		range: reportParams,
		status: activeRecords,
		// Archives are already ordered depth-first by views within each group;
		// sorting the flattened rows again would interleave the groups.
		sort: activeTab === 'posts-pages' ? sortReportCsvRows : undefined,
	} );

	// Date-range state lives in the URL search params, staged and committed by
	// the shared date-filter controller — same model as the dashboard.
	const dateFilters = useReportDateFilters( ROUTE_FROM );

	// The breadcrumb's "Stats" crumb links back to the dashboard, carrying the
	// current date range and comparison so returning restores the same view.
	const dashboardLink = useDashboardLink();

	/*
	 * Keyed by tab so the table's internal view state (sort, search, page)
	 * resets when the records set changes.
	 */
	const recordsTable =
		activeTab === 'posts-pages' ? (
			<ReportRecordsTable< StatsTopPostsComparisonItem >
				key="posts-pages"
				data={ records.posts.rows }
				fields={ postsFields }
				getItemId={ getPostRowId }
				isLoading={ records.posts.isLoading || records.posts.isFetching }
				initialView={ RECORDS_VIEW }
				searchLabel={ __( 'Search posts', 'jetpack-premium-analytics-pkg' ) }
			/>
		) : (
			<ReportDrilldownTable< ArchiveRow >
				key="archives"
				data={ records.archives.rows }
				fields={ archivesFields }
				getItemId={ getArchiveRowId }
				getItemParentId={ getArchiveRowParentId }
				isLoading={ records.archives.isLoading || records.archives.isFetching }
				initialView={ RECORDS_VIEW }
				searchLabel={ __( 'Search archives', 'jetpack-premium-analytics-pkg' ) }
				hideLevelMarkers
			/>
		);

	return (
		<ReportPageShell
			tabbed
			breadcrumbs={
				<Breadcrumbs
					items={ [
						{ label: __( 'Stats', 'jetpack-premium-analytics-pkg' ), to: dashboardLink },
						{ label: __( 'Posts & Pages', 'jetpack-premium-analytics-pkg' ) },
					] }
				/>
			}
			subTitle={ __( 'All your posts and archive pages.', 'jetpack-premium-analytics-pkg' ) }
			actions={
				canExport ? (
					<ReportCsvAction columns={ csvColumns } rows={ csvRows } filename={ csvFilename } />
				) : undefined
			}
		>
			<ReportPageLayout
				tabs={ <ReportPageTabs tabs={ tabs } value={ activeTab } onChange={ setActiveTab } /> }
				filters={ <DateFiltersPanel { ...dateFilters } /> }
			>
				{ records.isError ? (
					<ReportErrorState
						title={ __( 'Unable to load posts', 'jetpack-premium-analytics-pkg' ) }
						onRetry={ retry }
					/>
				) : (
					recordsTable
				) }
			</ReportPageLayout>
		</ReportPageShell>
	);
}

/**
 * Posts & Pages report page (default export for the report registry).
 *
 * React Query and global errors are provided by the `/reports/$report` stage,
 * which renders this lazily via the registry's `load` — the page mounts no
 * providers of its own.
 *
 * @return {JSX.Element} The Posts & Pages report page.
 */
export default function PostsReportPage(): JSX.Element {
	return <PostsReport />;
}

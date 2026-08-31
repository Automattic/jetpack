/**
 * External dependencies
 */
import { type StatsTopPostsComparisonItem } from '@jetpack-premium-analytics/data';
import { useReportDateFilters, useSectionTab } from '@jetpack-premium-analytics/routing';
import { StatsBreadcrumbs, StatsPageIcon } from '@jetpack-premium-analytics/ui';
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
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { route } from '../package.json';
import { REPORTS } from '../registry';
import { useReportParams } from '../use-report-params';
import {
	buildArchiveCsvRows,
	getArchivesFields,
	getPostsFields,
	getReportPostsTabs,
	getTabTitle,
	resolveTabId,
	usePostsReportRecords,
	type ArchiveRow,
} from './config';

// Every report shares the single dynamic route, so route-level hooks and
// navigations target this path with the `posts` param.
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
 * Shared initial view for both tabs: sorted by views, title absorbs spare width so
 * metric columns shrink to content instead of table-layout auto stretching them.
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
 * Second-level "view all" report for the Posts & Pages traffic module. Post titles
 * drill into the post/page detail route.
 *
 * @return {JSX.Element} The Posts & Pages report page.
 */
function PostsReport(): JSX.Element {
	// The route guard guarantees the window params are seeded, so URL search is the
	// single source of truth — resolve it with the same normalizer the widgets use.
	const reportParams = useReportParams();

	const tabs = useMemo( () => getReportPostsTabs(), [] );
	const [ activeTab, setActiveTab ] = useSectionTab( ROUTE_FROM, resolveTabId );

	const records = usePostsReportRecords( activeTab, reportParams );
	const retry = useReportRetry( records.refetch );

	const postsFields = useMemo(
		() => getPostsFields( records.posts.hasComparison, activeTab ),
		[ activeTab, records.posts.hasComparison ]
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

	const { getLabel } = REPORTS.posts;

	return (
		<ReportPageShell
			tabbed
			visual={ <StatsPageIcon /> }
			breadcrumbs={ <StatsBreadcrumbs items={ [ { label: getLabel() } ] } /> }
			actions={
				canExport ? (
					<ReportCsvAction columns={ csvColumns } rows={ csvRows } filename={ csvFilename } />
				) : undefined
			}
		>
			<ReportPageLayout
				title={ getTabTitle( activeTab ) }
				tabs={ <ReportPageTabs tabs={ tabs } value={ activeTab } onChange={ setActiveTab } /> }
				dateFilters={ dateFilters }
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
 * Registry entry point; React Query and error handling come from the
 * `/reports/$report` stage that renders this lazily.
 *
 * @return {JSX.Element} The Posts & Pages report page.
 */
export default function PostsReportPage(): JSX.Element {
	return <PostsReport />;
}

/**
 * External dependencies
 */
import {
	usePostThumbnails,
	type StatsTopPostsComparisonItem,
} from '@jetpack-premium-analytics/data';
import { useReportDateFilters, useSectionTab } from '@jetpack-premium-analytics/routing';
import { StatsBreadcrumbs, StatsPageIcon } from '@jetpack-premium-analytics/ui';
import {
	ReportEmptyState,
	ReportErrorState,
	ReportPageLayout,
	ReportPageShell,
	ReportPageTabs,
	ReportDrilldownTable,
	ReportRecordsTable,
	ReportCsvAction,
	archivesCsvExporter,
	getPostsCsvColumns,
	postsPagesCsvExporter,
	useReportCsvExport,
	useReportRetry,
	type ArchiveRow,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { useCallback, useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { route } from '../package.json';
import { REPORTS } from '../registry';
import { useReportParams } from '../use-report-params';
import {
	getArchivesFields,
	getPostsFields,
	getReportPostsTabs,
	getTabLabel,
	resolveTabId,
	usePostsReportRecords,
} from './config';
import type { JSX } from 'react';

// Every report shares the single dynamic route, so route-level hooks and
// navigations target this path with the `posts` param.
const ROUTE_FROM = route.path;

type ReportCsvRow = StatsTopPostsComparisonItem | ArchiveRow;

const EMPTY_POST_ROWS: StatsTopPostsComparisonItem[] = [];

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
 * Shared initial view for both tabs, sorted by views. The title is the primary
 * column on both, and absorbs the spare width so the metric column shrinks to content.
 */
const RECORDS_VIEW = {
	sort: { field: 'views', direction: 'desc' as const },
	layout: {
		styles: {
			views: { align: 'end' as const },
		},
	},
};

const POSTS_VIEW = { ...RECORDS_VIEW, titleField: 'title', mediaField: 'thumbnail' };

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
	const [ visiblePostRows, setVisiblePostRows ] = useState< StatsTopPostsComparisonItem[] >( [] );
	const handleVisiblePostRowsChange = useCallback( ( rows: StatsTopPostsComparisonItem[] ) => {
		// Preserve the array when only thumbnail-backed fields changed, or this callback loops.
		setVisiblePostRows( previous =>
			previous.length === rows.length && previous.every( ( row, index ) => row === rows[ index ] )
				? previous
				: rows
		);
	}, [] );
	const thumbnailUrls = usePostThumbnails(
		activeTab === 'posts-pages' ? visiblePostRows : EMPTY_POST_ROWS
	);

	const postsFields = useMemo(
		() => getPostsFields( records.posts.hasComparison, activeTab, thumbnailUrls ),
		[ activeTab, records.posts.hasComparison, thumbnailUrls ]
	);
	const archivesFields = useMemo(
		() => getArchivesFields( records.archives.hasComparison ),
		[ records.archives.hasComparison ]
	);

	const csvColumns = useMemo( () => getPostsCsvColumns< ReportCsvRow >(), [] );
	const activeRecords = activeTab === 'posts-pages' ? records.posts : records.archives;
	const csvExporter = activeTab === 'posts-pages' ? postsPagesCsvExporter : archivesCsvExporter;
	const csvExportRows = useMemo< ReportCsvRow[] >(
		() =>
			activeTab === 'posts-pages'
				? postsPagesCsvExporter.toCsvRows( records.posts.rows )
				: archivesCsvExporter.toCsvRows( records.archives.items ),
		[ activeTab, records.posts.rows, records.archives.items ]
	);
	const {
		canExport,
		rows: csvRows,
		filename: csvFilename,
	} = useReportCsvExport< ReportCsvRow >( {
		rows: csvExportRows,
		filenamePrefix: csvExporter.filenamePrefix,
		range: csvExporter.hasDateRange ? reportParams : undefined,
		status: activeRecords,
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
				initialView={ POSTS_VIEW }
				searchLabel={ __( 'Search posts', 'jetpack-premium-analytics-pkg' ) }
				onChangePageItems={ handleVisiblePostRowsChange }
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

	let tableReplacement: JSX.Element | undefined;

	if ( records.isError ) {
		tableReplacement = (
			<ReportErrorState
				title={ __( 'Unable to load posts', 'jetpack-premium-analytics-pkg' ) }
				onRetry={ retry }
			/>
		);
	} else if ( ! activeRecords.isLoading && activeRecords.rows.length === 0 ) {
		tableReplacement = <ReportEmptyState />;
	}

	return (
		<ReportPageShell
			visual={ <StatsPageIcon /> }
			breadcrumbs={ <StatsBreadcrumbs items={ [ { label: getLabel() } ] } /> }
			actions={
				canExport ? (
					<ReportCsvAction columns={ csvColumns } rows={ csvRows } filename={ csvFilename } />
				) : undefined
			}
		>
			<ReportPageLayout
				title={ getTabLabel( activeTab ) }
				tabs={ <ReportPageTabs tabs={ tabs } value={ activeTab } onChange={ setActiveTab } /> }
				dateFilters={ dateFilters }
			>
				{ tableReplacement ?? recordsTable }
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

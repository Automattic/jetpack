/**
 * External dependencies
 */
import { useSectionTab } from '@jetpack-premium-analytics/routing';
import { StatsBreadcrumbs, StatsPageIcon } from '@jetpack-premium-analytics/ui';
import {
	ReportErrorState,
	ReportPageLayout,
	ReportPageShell,
	ReportPageTabs,
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
import {
	getCommentsFields,
	getCommentsReportTabs,
	getTabTitle,
	resolveTabId,
	useCommentsReportRecords,
	type CommentReportRow,
} from './config';

const ROUTE_FROM = route.path;

const RECORDS_VIEW = {
	sort: { field: 'comments', direction: 'desc' as const },
	layout: {
		styles: {
			label: { width: '100%' },
			comments: { align: 'end' as const },
		},
	},
};

const sortCommentsCsvRows = ( a: CommentReportRow, b: CommentReportRow ) => b.value - a.value;

/**
 * Get the DataViews row id for a Comments report row.
 *
 * @param item - The Comments report row.
 * @return The row id.
 */
function getCommentRowId( item: CommentReportRow ): string {
	return item.id;
}

/**
 * Premium Analytics Comments report page.
 *
 * @return The Comments report page.
 */
function CommentsReport(): JSX.Element {
	const tabs = useMemo( () => getCommentsReportTabs(), [] );
	const [ activeTab, setActiveTab ] = useSectionTab( ROUTE_FROM, resolveTabId );
	const records = useCommentsReportRecords( activeTab );
	const fields = useMemo( () => getCommentsFields( activeTab ), [ activeTab ] );
	const csvColumns = useMemo< CsvColumn< CommentReportRow >[] >(
		() => [
			{ label: __( 'Name', 'jetpack-premium-analytics-pkg' ), getValue: row => row.label },
			{ label: __( 'Comments', 'jetpack-premium-analytics-pkg' ), getValue: row => row.value },
			{ label: __( 'URL', 'jetpack-premium-analytics-pkg' ), getValue: row => row.link ?? '' },
		],
		[]
	);
	const {
		canExport,
		rows: csvRows,
		filename: csvFilename,
	} = useReportCsvExport( {
		rows: records.rows,
		filenamePrefix: `comments-${ activeTab }`,
		status: records,
		sort: sortCommentsCsvRows,
	} );
	const retry = useReportRetry( records.refetch );

	// The crumb names the report; the header names the section open inside it.
	const label = __( 'All comments', 'jetpack-premium-analytics-pkg' );

	return (
		<ReportPageShell
			tabbed
			visual={ <StatsPageIcon /> }
			breadcrumbs={ <StatsBreadcrumbs items={ [ { label } ] } /> }
			subTitle={ __(
				'Learn about the comments your site receives by authors, posts, and pages.',
				'jetpack-premium-analytics-pkg'
			) }
			actions={
				canExport ? (
					<ReportCsvAction columns={ csvColumns } rows={ csvRows } filename={ csvFilename } />
				) : undefined
			}
		>
			<ReportPageLayout
				title={ getTabTitle( activeTab ) }
				tabs={ <ReportPageTabs tabs={ tabs } value={ activeTab } onChange={ setActiveTab } /> }
			>
				{ /*
				 * The error state replaces the table rather than sitting beside it:
				 * `ReportRecordsTable`'s empty state is row-count based, so a failed
				 * request would otherwise look like a legitimate empty report.
				 */ }
				{ records.isError ? (
					<ReportErrorState
						title={ __( 'Unable to load comments', 'jetpack-premium-analytics-pkg' ) }
						onRetry={ retry }
					/>
				) : (
					<ReportRecordsTable< CommentReportRow >
						key={ activeTab }
						data={ records.rows }
						fields={ fields }
						getItemId={ getCommentRowId }
						isLoading={ records.isLoading }
						initialView={ RECORDS_VIEW }
						searchLabel={ __( 'Search comments', 'jetpack-premium-analytics-pkg' ) }
					/>
				) }
			</ReportPageLayout>
		</ReportPageShell>
	);
}

/**
 * Comments report page (default export for the report registry).
 *
 * @return The Comments report page.
 */
export default function CommentsReportPage(): JSX.Element {
	return <CommentsReport />;
}

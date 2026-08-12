/**
 * External dependencies
 */
import { type StatsCommentFollowersItem } from '@jetpack-premium-analytics/data';
import { EmptyState, Text } from '@jetpack-premium-analytics/externals';
import { StatsBreadcrumbs, StatsPageIcon } from '@jetpack-premium-analytics/ui';
import {
	MetricValue,
	ReportErrorState,
	ReportPageLayout,
	ReportPageSection,
	ReportPageShell,
	ReportRecordsTable,
	ReportCsvAction,
	useReportCsvExport,
	useReportRetry,
	type CsvColumn,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { Spinner } from '@wordpress/components';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { getCommentFollowersFields, useCommentFollowersReportRecords } from './config';
import styles from './page.module.css';

/**
 * Initial records-table view: subscribers sort descending, the post column
 * absorbs spare width, and the numeric column stays compact and right-aligned.
 */
const RECORDS_VIEW = {
	sort: { field: 'subscribers', direction: 'desc' as const },
	layout: {
		styles: {
			post: { width: '100%' },
			subscribers: { align: 'end' as const },
		},
	},
};

const sortCommentFollowerCsvRows = ( a: StatsCommentFollowersItem, b: StatsCommentFollowersItem ) =>
	b.followers - a.followers;

/**
 * Stable row id for the records table.
 *
 * @param item - The comment-followers row.
 * @return The row id.
 */
function getCommentFollowerRowId( item: StatsCommentFollowersItem ): string {
	return String( item.id ?? item.link ?? item.label );
}

/**
 * Premium Analytics Comments Subscribers report page component.
 *
 * This legacy report is an all-time paginated list without date buckets, so
 * it composes only the breadcrumb header and records table: no date filters,
 * tabs, or performance chart.
 *
 * @return The Comments Subscribers report page.
 */
function CommentFollowersReport(): JSX.Element {
	const records = useCommentFollowersReportRecords();
	const fields = useMemo( () => getCommentFollowersFields(), [] );
	const csvColumns = useMemo< CsvColumn< StatsCommentFollowersItem >[] >(
		() => [
			{
				label: __( 'Post', 'jetpack-premium-analytics-pkg' ),
				getValue: row => String( row.label ?? '' ),
			},
			{
				label: __( 'Subscribers', 'jetpack-premium-analytics-pkg' ),
				getValue: row => row.followers,
			},
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
		filenamePrefix: 'comment-subscribers',
		status: records,
		sort: sortCommentFollowerCsvRows,
	} );
	const retry = useReportRetry( records.refetch );

	return (
		<ReportPageShell
			visual={ <StatsPageIcon /> }
			breadcrumbs={
				<StatsBreadcrumbs
					items={ [ { label: __( 'Comments Subscribers', 'jetpack-premium-analytics-pkg' ) } ] }
				/>
			}
			actions={
				canExport ? (
					<ReportCsvAction columns={ csvColumns } rows={ csvRows } filename={ csvFilename } />
				) : undefined
			}
		>
			<ReportPageLayout>
				{ records.isError ? (
					<ReportErrorState
						title={ __( 'Unable to load subscribers', 'jetpack-premium-analytics-pkg' ) }
						onRetry={ retry }
					/>
				) : (
					<>
						<ReportPageSection className={ styles.summary }>
							<Text variant="heading-md" render={ <h3 /> }>
								{ __( 'All Posts', 'jetpack-premium-analytics-pkg' ) }
							</Text>
							{ records.isLoading ? (
								<Spinner />
							) : (
								<MetricValue
									value={ records.allPostsFollowers ?? 0 }
									dataFormat={ { type: 'number' } }
								/>
							) }
						</ReportPageSection>
						<ReportRecordsTable< StatsCommentFollowersItem >
							data={ records.rows }
							fields={ fields }
							getItemId={ getCommentFollowerRowId }
							isLoading={ records.isLoading }
							initialView={ RECORDS_VIEW }
							searchLabel={ __( 'Search posts', 'jetpack-premium-analytics-pkg' ) }
							empty={
								<EmptyState.Root>
									<EmptyState.Title>
										{ __( 'No subscribers', 'jetpack-premium-analytics-pkg' ) }
									</EmptyState.Title>
								</EmptyState.Root>
							}
						/>
					</>
				) }
			</ReportPageLayout>
		</ReportPageShell>
	);
}

/**
 * Comments Subscribers report page (default export for the report registry).
 *
 * React Query and global error handling are provided by the shared report
 * stage, which lazily renders this page through the registry.
 *
 * @return The Comments Subscribers report page.
 */
export default function CommentFollowersReportPage(): JSX.Element {
	return <CommentFollowersReport />;
}

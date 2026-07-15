/**
 * External dependencies
 */
import { type StatsCommentFollowersItem } from '@jetpack-premium-analytics/data';
import { useDashboardLink } from '@jetpack-premium-analytics/routing';
import { ReportPageLayout, ReportRecordsTable } from '@jetpack-premium-analytics/widgets-toolkit';
import { Breadcrumbs, Page } from '@wordpress/admin-ui';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { EmptyState } from '@wordpress/ui';
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

	// Preserve the shared report window when returning to the dashboard.
	const dashboardLink = useDashboardLink();
	const emptyStateTitle = records.isError
		? __( 'Unable to load subscribers', 'jetpack-premium-analytics' )
		: __( 'No subscribers', 'jetpack-premium-analytics' );

	return (
		<Page
			breadcrumbs={
				<Breadcrumbs
					items={ [
						{ label: __( 'Stats', 'jetpack-premium-analytics' ), to: dashboardLink },
						{ label: __( 'Comments Subscribers', 'jetpack-premium-analytics' ) },
					] }
				/>
			}
			className={ styles.page }
		>
			<div className={ styles.content }>
				<ReportPageLayout>
					<ReportRecordsTable< StatsCommentFollowersItem >
						data={ records.rows }
						fields={ fields }
						getItemId={ getCommentFollowerRowId }
						isLoading={ records.isLoading }
						initialView={ RECORDS_VIEW }
						searchLabel={ __( 'Search posts', 'jetpack-premium-analytics' ) }
						empty={
							<EmptyState.Root>
								<EmptyState.Title>{ emptyStateTitle }</EmptyState.Title>
							</EmptyState.Root>
						}
					/>
				</ReportPageLayout>
			</div>
		</Page>
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

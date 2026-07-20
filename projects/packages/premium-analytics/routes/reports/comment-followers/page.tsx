/**
 * External dependencies
 */
import { type StatsCommentFollowersItem } from '@jetpack-premium-analytics/data';
import { useDashboardLink } from '@jetpack-premium-analytics/routing';
import {
	MetricValue,
	ReportPageLayout,
	ReportPageSection,
	ReportRecordsTable,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { Breadcrumbs, Page } from '@wordpress/admin-ui';
import { Spinner } from '@wordpress/components';
import { useCallback, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button, EmptyState, Text } from '@wordpress/ui';
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
	const { refetch } = records;
	const retry = useCallback( () => {
		void refetch();
	}, [ refetch ] );

	// Preserve the shared report window when returning to the dashboard.
	const dashboardLink = useDashboardLink();

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
					{ /*
					 * The error state replaces the summary and table rather than sitting
					 * beside them. `ReportRecordsTable`'s `empty` renders on row count, not
					 * fetch status, so a failed refetch over cached rows would otherwise
					 * leave stale data on screen with no notice and no way to retry.
					 */ }
					{ records.isError ? (
						<ReportPageSection>
							<EmptyState.Root>
								<EmptyState.Title>
									{ __( 'Unable to load subscribers', 'jetpack-premium-analytics' ) }
								</EmptyState.Title>
								<EmptyState.Description>
									{ __(
										"We couldn't load this data. Please try again in a moment.",
										'jetpack-premium-analytics'
									) }
								</EmptyState.Description>
								<EmptyState.Actions>
									<Button onClick={ retry }>{ __( 'Retry', 'jetpack-premium-analytics' ) }</Button>
								</EmptyState.Actions>
							</EmptyState.Root>
						</ReportPageSection>
					) : (
						<>
							<ReportPageSection className={ styles.summary }>
								<Text variant="heading-md" render={ <h3 /> }>
									{ __( 'All Posts', 'jetpack-premium-analytics' ) }
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
								searchLabel={ __( 'Search posts', 'jetpack-premium-analytics' ) }
								empty={
									<EmptyState.Root>
										<EmptyState.Title>
											{ __( 'No subscribers', 'jetpack-premium-analytics' ) }
										</EmptyState.Title>
									</EmptyState.Root>
								}
							/>
						</>
					) }
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

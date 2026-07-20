/**
 * External dependencies
 */
import { useDashboardLink, useSectionTab } from '@jetpack-premium-analytics/routing';
import {
	ReportPageLayout,
	ReportPageSection,
	ReportPageTabs,
	ReportRecordsTable,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { Breadcrumbs, Page } from '@wordpress/admin-ui';
import { useCallback, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button, EmptyState } from '@wordpress/ui';
/**
 * Internal dependencies
 */
import { route } from '../package.json';
import {
	getCommentsFields,
	getCommentsReportTabs,
	resolveTabId,
	useCommentsReportRecords,
	type CommentReportRow,
} from './config';
import styles from './page.module.css';

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
	const fields = useMemo( () => getCommentsFields(), [] );
	const { refetch } = records;
	const retry = useCallback( () => {
		void refetch();
	}, [ refetch ] );
	const dashboardLink = useDashboardLink();

	return (
		<Page
			breadcrumbs={
				<Breadcrumbs
					items={ [
						{ label: __( 'Stats', 'jetpack-premium-analytics' ), to: dashboardLink },
						{ label: __( 'Comments', 'jetpack-premium-analytics' ) },
					] }
				/>
			}
			subTitle={ __(
				'Learn about the comments your site receives by authors, posts, and pages.',
				'jetpack-premium-analytics'
			) }
			className={ styles.page }
		>
			<div className={ styles.content }>
				<ReportPageLayout
					tabs={ <ReportPageTabs tabs={ tabs } value={ activeTab } onChange={ setActiveTab } /> }
				>
					{ /*
					 * The error state replaces the table rather than sitting beside it:
					 * `ReportRecordsTable`'s empty state is row-count based, so a failed
					 * request would otherwise look like a legitimate empty report.
					 */ }
					{ records.isError ? (
						<ReportPageSection>
							<EmptyState.Root>
								<EmptyState.Title>
									{ __( 'Unable to load comments', 'jetpack-premium-analytics' ) }
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
						<ReportRecordsTable< CommentReportRow >
							key={ activeTab }
							data={ records.rows }
							fields={ fields }
							getItemId={ getCommentRowId }
							isLoading={ records.isLoading }
							initialView={ RECORDS_VIEW }
							searchLabel={ __( 'Search comments', 'jetpack-premium-analytics' ) }
						/>
					) }
				</ReportPageLayout>
			</div>
		</Page>
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

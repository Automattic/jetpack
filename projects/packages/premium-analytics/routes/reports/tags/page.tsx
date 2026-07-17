/**
 * External dependencies
 */
import { useDashboardLink } from '@jetpack-premium-analytics/routing';
import {
	ReportPageLayout,
	ReportPageSection,
	ReportRecordsTable,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { Breadcrumbs, Page } from '@wordpress/admin-ui';
import { useCallback, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button, EmptyState } from '@wordpress/ui';
/**
 * Internal dependencies
 */
import { getTagRowId, getTagsFields, useTagsReportRecords } from './config';
import styles from './page.module.css';
import type { StatsTagsItem } from '@jetpack-premium-analytics/data';

/**
 * Initial records-table view: views sort descending, the label column absorbs
 * spare width, and the numeric column stays compact and right-aligned.
 */
const RECORDS_VIEW = {
	sort: { field: 'views', direction: 'desc' as const },
	layout: {
		styles: {
			label: { width: '100%' },
			views: { align: 'end' as const },
		},
	},
};

/**
 * Premium Analytics Tags & categories report page component.
 *
 * The `stats/tags` endpoint reports one flat all-time list and ignores
 * date-window parameters (verified against WPCOM; Calypso never sends date
 * params here either), so the page composes only the breadcrumb header and
 * records table: no date filters, tabs, or performance chart.
 *
 * @return The Tags & categories report page.
 */
function TagsReport(): JSX.Element {
	const records = useTagsReportRecords();
	const fields = useMemo( () => getTagsFields(), [] );
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
						{ label: __( 'Tags & categories', 'jetpack-premium-analytics' ) },
					] }
				/>
			}
			subTitle={ __( 'Your most visited tags and categories.', 'jetpack-premium-analytics' ) }
			className={ styles.page }
		>
			<div className={ styles.content }>
				<ReportPageLayout>
					{ /*
					 * The error state replaces the table rather than sitting beside it:
					 * `ReportRecordsTable`'s `empty` renders on row count, not fetch
					 * status, so a failed refetch over cached rows would otherwise leave
					 * stale data on screen with no notice and no way to retry.
					 */ }
					{ records.isError ? (
						<ReportPageSection>
							<EmptyState.Root>
								<EmptyState.Title>
									{ __( 'Unable to load tags and categories', 'jetpack-premium-analytics' ) }
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
						<ReportRecordsTable< StatsTagsItem >
							data={ records.rows }
							fields={ fields }
							getItemId={ getTagRowId }
							isLoading={ records.isLoading }
							initialView={ RECORDS_VIEW }
							searchLabel={ __( 'Search tags and categories', 'jetpack-premium-analytics' ) }
						/>
					) }
				</ReportPageLayout>
			</div>
		</Page>
	);
}

/**
 * Tags & categories report page (default export for the report registry).
 *
 * @return The Tags & categories report page.
 */
export default function TagsReportPage(): JSX.Element {
	return <TagsReport />;
}

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
import { getAnnualInsightsFields, useAnnualInsightsReportRecords } from './config';
import styles from './page.module.css';
import type { StatsInsightsYear } from '@jetpack-premium-analytics/data';

const RECORDS_VIEW = {
	sort: { field: 'year', direction: 'desc' as const },
	layout: {
		styles: {
			year: { width: '100%' },
			total_posts: { align: 'end' as const },
			total_comments: { align: 'end' as const },
			avg_comments: { align: 'end' as const },
			total_likes: { align: 'end' as const },
			avg_likes: { align: 'end' as const },
			total_words: { align: 'end' as const },
			avg_words: { align: 'end' as const },
		},
	},
};

/**
 * Get the DataViews row id for an Annual insights row.
 *
 * @param item - The Annual insights row.
 * @return The row id.
 */
function getAnnualInsightRowId( item: StatsInsightsYear ): string {
	return item.year;
}

/**
 * Premium Analytics Annual insights report page.
 *
 * @return The Annual insights report page.
 */
function AnnualInsightsReport(): JSX.Element {
	const records = useAnnualInsightsReportRecords();
	const fields = useMemo( () => getAnnualInsightsFields(), [] );
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
						{ label: __( 'Annual insights', 'jetpack-premium-analytics' ) },
					] }
				/>
			}
			subTitle={ __(
				'Year-by-year publishing and engagement totals.',
				'jetpack-premium-analytics'
			) }
			className={ styles.page }
		>
			<div className={ styles.content }>
				<ReportPageLayout>
					{ /*
					 * The error state replaces the table rather than sitting beside it:
					 * `ReportRecordsTable`'s empty state is row-count based, so a failed
					 * request would otherwise look like a legitimate empty report.
					 */ }
					{ records.isError ? (
						<ReportPageSection>
							<EmptyState.Root>
								<EmptyState.Title>
									{ __( 'Unable to load annual insights', 'jetpack-premium-analytics' ) }
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
						<ReportRecordsTable< StatsInsightsYear >
							data={ records.rows }
							fields={ fields }
							getItemId={ getAnnualInsightRowId }
							isLoading={ records.isLoading }
							initialView={ RECORDS_VIEW }
							searchLabel={ __( 'Search annual insights', 'jetpack-premium-analytics' ) }
						/>
					) }
				</ReportPageLayout>
			</div>
		</Page>
	);
}

/**
 * Annual insights report page (default export for the report registry).
 *
 * @return The Annual insights report page.
 */
export default function AnnualInsightsReportPage(): JSX.Element {
	return <AnnualInsightsReport />;
}

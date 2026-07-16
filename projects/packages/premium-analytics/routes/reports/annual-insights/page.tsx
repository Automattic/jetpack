/**
 * External dependencies
 */
import { useDashboardLink } from '@jetpack-premium-analytics/routing';
import { ReportPageLayout, ReportRecordsTable } from '@jetpack-premium-analytics/widgets-toolkit';
import { Breadcrumbs, Page } from '@wordpress/admin-ui';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
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
			posts: { align: 'end' as const },
			words: { align: 'end' as const },
			likes: { align: 'end' as const },
			comments: { align: 'end' as const },
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
					<ReportRecordsTable< StatsInsightsYear >
						data={ records.rows }
						fields={ fields }
						getItemId={ getAnnualInsightRowId }
						isLoading={ records.isLoading }
						initialView={ RECORDS_VIEW }
						searchLabel={ __( 'Search annual insights', 'jetpack-premium-analytics' ) }
					/>
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

/**
 * External dependencies
 */
import { StatsBreadcrumbs, StatsPageIcon } from '@jetpack-premium-analytics/ui';
import {
	ExporterCsvAction,
	ReportPageLayout,
	ReportErrorState,
	ReportPageShell,
	ReportRecordsTable,
	annualInsightsCsvExporter,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { REPORTS } from '../registry';
import { useReportParams } from '../use-report-params';
import { getAnnualInsightsFields, useAnnualInsightsReportRecords } from './config';
import type { StatsInsightsYear } from '@jetpack-premium-analytics/data';
import type { JSX } from 'react';

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
			total_images: { align: 'end' as const },
			avg_images: { align: 'end' as const },
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
	const reportParams = useReportParams();
	const fields = useMemo( () => getAnnualInsightsFields(), [] );

	const { getLabel } = REPORTS[ 'annual-insights' ];

	return (
		<ReportPageShell
			visual={ <StatsPageIcon /> }
			breadcrumbs={ <StatsBreadcrumbs items={ [ { label: getLabel() } ] } /> }
			actions={
				<ExporterCsvAction
					exporter={ annualInsightsCsvExporter }
					items={ records.rows }
					status={ records }
					reportParams={ reportParams }
				/>
			}
		>
			<ReportPageLayout title={ getLabel() }>
				<ReportErrorState
					status={ records }
					retryDescription={ __(
						"We couldn't load annual insights. Please try again in a moment.",
						'jetpack-premium-analytics-pkg'
					) }
				>
					<ReportRecordsTable< StatsInsightsYear >
						data={ records.rows }
						fields={ fields }
						getItemId={ getAnnualInsightRowId }
						isLoading={ records.isLoading }
						isFetching={ records.isFetching }
						initialView={ RECORDS_VIEW }
						searchLabel={ __( 'Search annual insights', 'jetpack-premium-analytics-pkg' ) }
					/>
				</ReportErrorState>
			</ReportPageLayout>
		</ReportPageShell>
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

/**
 * External dependencies
 */
import { StatsBreadcrumbs, StatsPageIcon } from '@jetpack-premium-analytics/ui';
import {
	ReportErrorState,
	ReportPageLayout,
	ReportRecordsTable,
	ReportCsvAction,
	useReportCsvExport,
	useReportRetry,
	type CsvColumn,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { Page } from '@wordpress/admin-ui';
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

const sortAnnualInsightsCsvRows = ( a: StatsInsightsYear, b: StatsInsightsYear ) =>
	Number( b.year ) - Number( a.year );

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
	const csvColumns = useMemo< CsvColumn< StatsInsightsYear >[] >(
		() => [
			{ label: __( 'Year', 'jetpack-premium-analytics-pkg' ), getValue: row => row.year },
			{
				label: __( 'Total posts', 'jetpack-premium-analytics-pkg' ),
				getValue: row => row.total_posts,
			},
			{
				label: __( 'Total comments', 'jetpack-premium-analytics-pkg' ),
				getValue: row => row.total_comments,
			},
			{
				label: __( 'Avg comments per post', 'jetpack-premium-analytics-pkg' ),
				getValue: row => row.avg_comments,
			},
			{
				label: __( 'Total likes', 'jetpack-premium-analytics-pkg' ),
				getValue: row => row.total_likes,
			},
			{
				label: __( 'Avg likes per post', 'jetpack-premium-analytics-pkg' ),
				getValue: row => row.avg_likes,
			},
			{
				label: __( 'Total words', 'jetpack-premium-analytics-pkg' ),
				getValue: row => row.total_words,
			},
			{
				label: __( 'Avg words per post', 'jetpack-premium-analytics-pkg' ),
				getValue: row => row.avg_words,
			},
		],
		[]
	);
	const {
		canExport,
		rows: csvRows,
		filename: csvFilename,
	} = useReportCsvExport( {
		rows: records.rows,
		filenamePrefix: 'annual-insights',
		status: records,
		sort: sortAnnualInsightsCsvRows,
	} );
	const retry = useReportRetry( records.refetch );

	return (
		<Page
			visual={ <StatsPageIcon /> }
			breadcrumbs={
				<StatsBreadcrumbs
					items={ [ { label: __( 'Annual insights', 'jetpack-premium-analytics-pkg' ) } ] }
				/>
			}
			subTitle={ __(
				'Year-by-year publishing and engagement totals.',
				'jetpack-premium-analytics-pkg'
			) }
			actions={
				canExport ? (
					<ReportCsvAction columns={ csvColumns } rows={ csvRows } filename={ csvFilename } />
				) : undefined
			}
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
						<ReportErrorState
							title={ __( 'Unable to load annual insights', 'jetpack-premium-analytics-pkg' ) }
							onRetry={ retry }
						/>
					) : (
						<ReportRecordsTable< StatsInsightsYear >
							data={ records.rows }
							fields={ fields }
							getItemId={ getAnnualInsightRowId }
							isLoading={ records.isLoading }
							initialView={ RECORDS_VIEW }
							searchLabel={ __( 'Search annual insights', 'jetpack-premium-analytics-pkg' ) }
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

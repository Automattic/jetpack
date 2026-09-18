/**
 * External dependencies
 */
import { Text } from '@jetpack-premium-analytics/externals';
import { StatsBreadcrumbs, StatsPageIcon } from '@jetpack-premium-analytics/ui';
import {
	ReportCsvAction,
	ReportErrorState,
	ReportPageLayout,
	ReportPageShell,
	ReportRecordsTable,
	getEarningsStatus,
	getWordAdsHistoryFields,
	useReportCsvExport,
	useReportRetry,
	type CsvColumn,
	type EarningsHistoryRow,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { REPORTS } from '../registry';
import { useEarningsReportRecords } from './config';
import styles from './page.module.css';

const RECORDS_VIEW = {
	sort: { field: 'period', direction: 'desc' as const },
	layout: {
		styles: {
			period: { width: '100%' },
			amount: { align: 'end' as const },
			pageviews: { align: 'end' as const },
		},
	},
};

/**
 * Get the DataViews row id for an earnings-history row.
 *
 * @param item - The earnings-history row.
 * @return The row id.
 */
function getEarningsRowId( item: EarningsHistoryRow ): string {
	return item.id;
}

// The payload arrives period-keyed in no particular order, so the export needs the
// table's own ordering applied to it.
const sortEarningsCsvRows = ( a: EarningsHistoryRow, b: EarningsHistoryRow ) =>
	b.period.localeCompare( a.period );

/**
 * Premium Analytics WordAds earnings report page.
 *
 * @return The earnings report page.
 */
function EarningsReport(): JSX.Element {
	const records = useEarningsReportRecords();
	const fields = useMemo( () => getWordAdsHistoryFields(), [] );
	const csvColumns = useMemo< CsvColumn< EarningsHistoryRow >[] >(
		() => [
			{ label: __( 'Period', 'jetpack-premium-analytics-pkg' ), getValue: row => row.period },
			{ label: __( 'Earnings', 'jetpack-premium-analytics-pkg' ), getValue: row => row.amount },
			{
				label: __( 'Ads Served', 'jetpack-premium-analytics-pkg' ),
				getValue: row => row.pageviews,
			},
			{
				label: __( 'Status', 'jetpack-premium-analytics-pkg' ),
				// The numeric code says nothing to a reader of the export.
				getValue: row => getEarningsStatus( row.status ).label,
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
		filenamePrefix: 'earnings',
		status: records,
		sort: sortEarningsCsvRows,
	} );
	const retry = useReportRetry( records.refetch );

	const { getLabel, getTitle } = REPORTS.earnings;

	return (
		<ReportPageShell
			visual={ <StatsPageIcon /> }
			breadcrumbs={ <StatsBreadcrumbs items={ [ { label: getLabel() } ] } /> }
			actions={
				canExport ? (
					<ReportCsvAction columns={ csvColumns } rows={ csvRows } filename={ csvFilename } />
				) : undefined
			}
		>
			{ /* No date filters: the `wordads/earnings` endpoint is all-time, and the Ads tab has no global date controls. */ }
			<ReportPageLayout title={ getTitle() }>
				{ records.isError ? (
					<ReportErrorState
						title={ __( 'Unable to load earnings', 'jetpack-premium-analytics-pkg' ) }
						onRetry={ retry }
					/>
				) : (
					<>
						<Text className={ styles.note } variant="body-md" render={ <p /> }>
							{ __(
								'Ads Served is the number of ads we attempted to display (page impressions × available ad slots). Not every ad served results in a paid impression.',
								'jetpack-premium-analytics-pkg'
							) }
						</Text>
						<ReportRecordsTable< EarningsHistoryRow >
							data={ records.rows }
							fields={ fields }
							getItemId={ getEarningsRowId }
							isLoading={ records.isLoading }
							initialView={ RECORDS_VIEW }
							searchLabel={ __( 'Search earnings history', 'jetpack-premium-analytics-pkg' ) }
						/>
					</>
				) }
			</ReportPageLayout>
		</ReportPageShell>
	);
}

/**
 * Earnings report page (default export for the report registry).
 *
 * @return The earnings report page.
 */
export default function EarningsReportPage(): JSX.Element {
	return <EarningsReport />;
}

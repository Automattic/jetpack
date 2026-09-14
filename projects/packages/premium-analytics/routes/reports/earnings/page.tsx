/**
 * External dependencies
 */
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

/*
 * Newest period first. Sorting Period on the raw `YYYY-MM` key keeps it
 * chronological, as it does in the widget.
 */
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
				{ /*
				 * The error state replaces the table rather than sitting beside it:
				 * `ReportRecordsTable`'s empty state is row-count based, so a failed
				 * request would otherwise look like a legitimate empty report.
				 */ }
				{ records.isError ? (
					<ReportErrorState
						title={ __( 'Unable to load earnings', 'jetpack-premium-analytics-pkg' ) }
						onRetry={ retry }
					/>
				) : (
					<ReportRecordsTable< EarningsHistoryRow >
						data={ records.rows }
						fields={ fields }
						getItemId={ getEarningsRowId }
						isLoading={ records.isLoading }
						initialView={ RECORDS_VIEW }
						searchLabel={ __( 'Search earnings history', 'jetpack-premium-analytics-pkg' ) }
					/>
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

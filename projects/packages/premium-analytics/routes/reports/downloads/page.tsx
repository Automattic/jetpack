/**
 * External dependencies
 */
import {
	normalizeReportParams,
	type StatsFileDownloadsItem,
	type StatsFileDownloadsComparisonItem,
} from '@jetpack-premium-analytics/data';
import { useDashboardLink, useReportDateFilters } from '@jetpack-premium-analytics/routing';
import { DateFiltersPanel } from '@jetpack-premium-analytics/ui';
import {
	ReportErrorState,
	ReportPageLayout,
	ReportPageShell,
	ReportRecordsTable,
	ReportCsvAction,
	useReportCsvExport,
	useReportRetry,
	type CsvColumn,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { Breadcrumbs } from '@wordpress/admin-ui';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useSearch } from '@wordpress/route';
/**
 * Internal dependencies
 */
import { route } from '../package.json';
import { getDownloadsFields, useDownloadsReportRecords } from './config';

const ROUTE_FROM = route.path;

/**
 * Stable table row identity for a downloaded file.
 *
 * @param item - File-download row.
 * @return The row identity.
 */
function getDownloadRowId( item: StatsFileDownloadsComparisonItem ): string {
	return item.link ?? String( item.label ?? item.shortLabel ?? '' );
}

const RECORDS_VIEW = {
	sort: { field: 'downloads', direction: 'desc' as const },
	layout: {
		styles: {
			file: { width: '100%' },
			downloads: { align: 'end' as const },
		},
	},
};

const sortDownloadCsvRows = ( a: StatsFileDownloadsItem, b: StatsFileDownloadsItem ) =>
	b.downloads - a.downloads;

/**
 * File downloads report page.
 *
 * @return The rendered report page.
 */
function DownloadsReport(): JSX.Element {
	const search = useSearch( { from: ROUTE_FROM } ) as Record< string, string | undefined >;
	const reportParams = useMemo(
		() => normalizeReportParams( search as Parameters< typeof normalizeReportParams >[ 0 ] ),
		[ search ]
	);
	const records = useDownloadsReportRecords( reportParams );
	const retry = useReportRetry( records.refetch );
	const fields = useMemo(
		() => getDownloadsFields( records.hasComparison ),
		[ records.hasComparison ]
	);
	const csvColumns = useMemo< CsvColumn< StatsFileDownloadsItem >[] >(
		() => [
			{
				label: __( 'File', 'jetpack-premium-analytics-pkg' ),
				getValue: row => row.shortLabel ?? String( row.label ?? '' ),
			},
			{
				label: __( 'Downloads', 'jetpack-premium-analytics-pkg' ),
				getValue: row => row.downloads,
			},
			{ label: __( 'URL', 'jetpack-premium-analytics-pkg' ), getValue: row => row.link ?? '' },
		],
		[]
	);
	const {
		canExport,
		rows: csvRows,
		filename: csvFilename,
	} = useReportCsvExport( {
		rows: records.rows,
		filenamePrefix: 'file-downloads',
		range: reportParams,
		status: records,
		sort: sortDownloadCsvRows,
	} );
	const isRecordsLoading = records.isLoading || records.isFetching;

	const dateFilters = useReportDateFilters( ROUTE_FROM );
	const dashboardLink = useDashboardLink();

	return (
		<ReportPageShell
			breadcrumbs={
				<Breadcrumbs
					items={ [
						{ label: __( 'Stats', 'jetpack-premium-analytics-pkg' ), to: dashboardLink },
						{ label: __( 'File downloads', 'jetpack-premium-analytics-pkg' ) },
					] }
				/>
			}
			actions={
				canExport ? (
					<ReportCsvAction columns={ csvColumns } rows={ csvRows } filename={ csvFilename } />
				) : undefined
			}
		>
			<ReportPageLayout filters={ <DateFiltersPanel { ...dateFilters } /> }>
				{ records.isError ? (
					<ReportErrorState
						title={ __( 'Unable to load file downloads', 'jetpack-premium-analytics-pkg' ) }
						onRetry={ retry }
					/>
				) : (
					<ReportRecordsTable< StatsFileDownloadsComparisonItem >
						data={ records.rows }
						fields={ fields }
						getItemId={ getDownloadRowId }
						isLoading={ isRecordsLoading }
						initialView={ RECORDS_VIEW }
						searchLabel={ __( 'Search files', 'jetpack-premium-analytics-pkg' ) }
					/>
				) }
			</ReportPageLayout>
		</ReportPageShell>
	);
}

/**
 * File downloads report page (default export for the report registry).
 *
 * @return The rendered report page.
 */
export default function DownloadsReportPage(): JSX.Element {
	return <DownloadsReport />;
}

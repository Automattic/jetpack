/**
 * External dependencies
 */
import { normalizeReportParams } from '@jetpack-premium-analytics/data';
import { useReportDateFilters } from '@jetpack-premium-analytics/routing';
import { DateFiltersPanel, StatsBreadcrumbs, StatsPageIcon } from '@jetpack-premium-analytics/ui';
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
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useSearch } from '@wordpress/route';
/**
 * Internal dependencies
 */
import { route } from '../package.json';
import { getSearchTermsFields, useSearchTermsReportRecords, type SearchTermRow } from './config';

const ROUTE_FROM = route.path;

/**
 * Stable row id for the records table.
 *
 * @param item - The search-term row.
 * @return The row id.
 */
function getSearchTermRowId( item: SearchTermRow ): string {
	return item.id;
}

const RECORDS_VIEW = {
	sort: { field: 'views', direction: 'desc' as const },
	layout: {
		styles: {
			term: { width: '100%' },
			views: { align: 'end' as const },
		},
	},
};

const sortSearchTermCsvRows = ( a: SearchTermRow, b: SearchTermRow ) => b.views - a.views;

/**
 * Premium Analytics Search terms report page.
 *
 * @return The report page.
 */
export default function SearchTermsReportPage(): JSX.Element {
	const search = useSearch( { from: ROUTE_FROM } ) as Record< string, string | undefined >;
	const reportParams = useMemo(
		() => normalizeReportParams( search as Parameters< typeof normalizeReportParams >[ 0 ] ),
		[ search ]
	);
	const records = useSearchTermsReportRecords( reportParams );
	const retry = useReportRetry( records.refetch );
	const fields = useMemo(
		() => getSearchTermsFields( records.table.hasComparison ),
		[ records.table.hasComparison ]
	);
	const csvColumns = useMemo< CsvColumn< SearchTermRow >[] >(
		() => [
			{ label: __( 'Search term', 'jetpack-premium-analytics-pkg' ), getValue: row => row.term },
			{ label: __( 'Views', 'jetpack-premium-analytics-pkg' ), getValue: row => row.views },
		],
		[]
	);
	const {
		canExport,
		rows: csvRows,
		filename: csvFilename,
	} = useReportCsvExport( {
		rows: records.table.rows,
		filenamePrefix: 'search-terms',
		range: reportParams,
		status: records.table,
		sort: sortSearchTermCsvRows,
	} );
	const dateFilters = useReportDateFilters( ROUTE_FROM );
	const tableIsLoading = records.table.isLoading || records.table.isFetching;

	return (
		<ReportPageShell
			visual={ <StatsPageIcon /> }
			breadcrumbs={
				<StatsBreadcrumbs
					items={ [ { label: __( 'Search terms', 'jetpack-premium-analytics-pkg' ) } ] }
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
						title={ __( 'Unable to load search terms', 'jetpack-premium-analytics-pkg' ) }
						onRetry={ retry }
					/>
				) : (
					<ReportRecordsTable< SearchTermRow >
						data={ records.table.rows }
						fields={ fields }
						getItemId={ getSearchTermRowId }
						isLoading={ tableIsLoading }
						initialView={ RECORDS_VIEW }
						searchLabel={ __( 'Search terms', 'jetpack-premium-analytics-pkg' ) }
					/>
				) }
			</ReportPageLayout>
		</ReportPageShell>
	);
}

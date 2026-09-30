/**
 * Internal dependencies
 */
import { buildCsv, buildCsvDateRangeFilename, saveCsv } from '../helpers/build-csv';
import type { ReportCsvExporter } from './types';
import type { ReportParams } from '@jetpack-premium-analytics/data';

/** Fetch a report's full rows and save them as the report page's CSV. */
export async function downloadReportCsv< TItem, TRow >(
	exporter: ReportCsvExporter< TItem, TRow >,
	reportParams: ReportParams
): Promise< void > {
	const rows = exporter.toCsvRows( await exporter.fetchItems( reportParams ) );
	const filename = exporter.hasDateRange
		? buildCsvDateRangeFilename( exporter.filenamePrefix, reportParams )
		: exporter.filenamePrefix;

	saveCsv( filename, buildCsv( exporter.getColumns(), rows ) );
}

/**
 * Internal dependencies
 */
import { buildCsv, buildCsvDateRangeFilename, saveCsv } from '../helpers/build-csv';
import type { ReportCsvExporter } from './types';
import type { ReportParams } from '@jetpack-premium-analytics/data';

/** The report's CSV filename, dated when the report covers a date range. */
export function getReportCsvFilename< TItem, TRow >(
	exporter: ReportCsvExporter< TItem, TRow >,
	reportParams: ReportParams
): string {
	return exporter.hasDateRange
		? buildCsvDateRangeFilename( exporter.filenamePrefix, reportParams )
		: exporter.filenamePrefix;
}

/** Fetch a report's full rows and save them as the report page's CSV. */
export async function downloadReportCsv< TItem, TRow >(
	exporter: ReportCsvExporter< TItem, TRow >,
	reportParams: ReportParams
): Promise< void > {
	const rows = exporter.toCsvRows( await exporter.fetchItems( reportParams ) );
	saveCsv(
		getReportCsvFilename( exporter, reportParams ),
		buildCsv( exporter.getColumns(), rows )
	);
}

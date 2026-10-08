/**
 * External dependencies
 */
import { PRESET_ALL_TIME } from '@jetpack-premium-analytics/datetime';
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
	if ( ! exporter.hasDateRange ) {
		return exporter.filenamePrefix;
	}

	// All time names itself: on a report its `from` is only a placeholder.
	return reportParams.preset === PRESET_ALL_TIME
		? `${ exporter.filenamePrefix }-${ PRESET_ALL_TIME }`
		: buildCsvDateRangeFilename( exporter.filenamePrefix, reportParams );
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

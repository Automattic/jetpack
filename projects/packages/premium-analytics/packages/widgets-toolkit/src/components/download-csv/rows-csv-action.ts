/**
 * Internal dependencies
 */
import {
	buildCsv,
	buildCsvDateRangeFilename,
	saveCsv,
	type CsvColumn,
	type CsvDateRange,
} from '../../helpers/build-csv';
import { getReportCsvFilename } from '../../report-exports/download-report-csv';
import { useWidgetRootContext } from '../widget-root';
import { useCsvDownloadAction, type CsvDownloadAction } from './csv-download-action';
import { isReportCsvReady, type ReportCsvExportStatus } from './use-report-csv-export';

export type RowsCsvActionOptions< TRow > = {
	/**
	 * The rows the widget already loaded, in file order.
	 */
	rows: TRow[];

	columns: CsvColumn< TRow >[];

	filenamePrefix: string;

	/**
	 * Date the filename by the report window, or by `range` for a widget with a window of its own.
	 */
	hasDateRange: boolean;

	range?: CsvDateRange;

	/**
	 * The primary request's state, its error not hidden by rows kept on screen.
	 */
	status: ReportCsvExportStatus;
};

/** A download of the widget's loaded rows, or null until they settle. */
export function useRowsCsvAction< TRow >(
	options?: RowsCsvActionOptions< TRow >
): CsvDownloadAction | null {
	const { reportParams } = useWidgetRootContext();

	return useCsvDownloadAction(
		options && isReportCsvReady( options.status, options.rows.length )
			? async () => {
					const { rows, columns, filenamePrefix, range } = options;
					const filename = range
						? buildCsvDateRangeFilename( filenamePrefix, range )
						: getReportCsvFilename( options, reportParams );

					saveCsv( filename, buildCsv( columns, rows ) );
				}
			: null
	);
}

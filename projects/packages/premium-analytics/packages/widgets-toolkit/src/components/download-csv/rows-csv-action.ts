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
	 * The primary request's state, its error not hidden by rows kept on screen.
	 */
	status: ReportCsvExportStatus & {
		/**
		 * Whether the rows are a previous range's, which a request paused offline keeps without fetching.
		 */
		isPlaceholderData: boolean;
	};

	exporter?: never;
	report?: never;
	rowCount?: never;
} & (
	| {
			/**
			 * Whether the filename carries the report window's dates.
			 */
			hasDateRange: boolean;
			range?: never;
	  }
	| {
			/**
			 * Dates the file by the widget's own window instead of the report window.
			 */
			range: CsvDateRange;
			hasDateRange?: never;
	  }
);

/** A download of the widget's loaded rows, or null until they settle. */
export function useRowsCsvAction< TRow >(
	options?: RowsCsvActionOptions< TRow >
): CsvDownloadAction | null {
	const { reportParams } = useWidgetRootContext();

	return useCsvDownloadAction(
		options &&
			! options.status.isPlaceholderData &&
			isReportCsvReady( options.status, options.rows.length )
			? async () => {
					const { filenamePrefix, hasDateRange = false, range } = options;

					saveCsv(
						range
							? buildCsvDateRangeFilename( filenamePrefix, range )
							: getReportCsvFilename( { filenamePrefix, hasDateRange }, reportParams ),
						buildCsv( options.columns, options.rows )
					);
				}
			: null
	);
}

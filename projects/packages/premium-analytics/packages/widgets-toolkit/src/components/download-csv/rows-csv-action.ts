/**
 * Internal dependencies
 */
import { buildCsv, saveCsv, type CsvColumn } from '../../helpers/build-csv';
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
	 * Whether the filename carries the report window's dates.
	 */
	hasDateRange: boolean;

	/**
	 * The primary request's state, its error not hidden by rows kept on screen.
	 */
	status: ReportCsvExportStatus & {
		/**
		 * Whether the rows are a previous range's, which a request paused offline keeps without fetching.
		 */
		isPlaceholderData: boolean;
	};

	// Never alongside the report download's options, so one call cannot mix the two.
	exporter?: never;
	report?: never;
	rowCount?: never;
};

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
					saveCsv(
						getReportCsvFilename( options, reportParams ),
						buildCsv( options.columns, options.rows )
					);
				}
			: null
	);
}

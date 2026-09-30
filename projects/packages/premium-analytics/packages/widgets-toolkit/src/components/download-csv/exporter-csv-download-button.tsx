/**
 * Internal dependencies
 */
import { downloadReportCsv } from '../../report-exports/download-report-csv';
import { useWidgetRootContext } from '../widget-root';
import { CsvDownloadButton, type CsvDownloadButtonProps } from './csv-download-button';
import { isReportCsvReady, type ReportCsvExportStatus } from './use-report-csv-export';
import type { ReportCsvExporter } from '../../report-exports/types';

type ExporterCsvDownloadButtonProps< TItem, TRow > = Omit<
	CsvDownloadButtonProps,
	'onDownload'
> & {
	exporter: ReportCsvExporter< TItem, TRow >;
	/** The widget's own request state for the active range. */
	status: ReportCsvExportStatus;
	/** How many rows the widget shows; an empty widget offers no download. */
	rowCount: number;
};

/**
 * Widget action that fetches the linked report through its exporter on click and saves its CSV.
 *
 * @return The rendered action, or null until the widget has settled rows to back it.
 */
export function ExporterCsvDownloadButton< TItem, TRow >( {
	exporter,
	status,
	rowCount,
	...buttonProps
}: ExporterCsvDownloadButtonProps< TItem, TRow > ) {
	const { reportParams } = useWidgetRootContext();

	if ( ! isReportCsvReady( status, rowCount ) ) {
		return null;
	}

	return (
		<CsvDownloadButton
			{ ...buttonProps }
			onDownload={ () => downloadReportCsv( exporter, reportParams ) }
		/>
	);
}

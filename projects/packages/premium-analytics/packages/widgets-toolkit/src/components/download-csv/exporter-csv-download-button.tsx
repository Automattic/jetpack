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
	/** The widget's request state for the active range; the error is the primary period's alone. */
	status: ReportCsvExportStatus;
	/** How many rows the widget shows; an empty widget offers no download. */
	rowCount: number;
};

/** Widget action that downloads the linked report's full CSV once the widget's rows settle. */
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

/**
 * Internal dependencies
 */
import { downloadReportCsv } from '../../report-exports/download-report-csv';
import { useWidgetRootContext } from '../widget-root';
import { CsvDownloadButton, type CsvDownloadButtonProps } from './csv-download-button';
import { isCsvExportEnabled } from './is-csv-export-enabled';
import type { ReportCsvExporter } from '../../report-exports/types';

export type FullReportCsvDownloadButtonProps< TItem, TRow > = Omit<
	CsvDownloadButtonProps,
	'onDownload'
> & {
	exporter: ReportCsvExporter< TItem, TRow >;
	/** Whether the widget's own rows for the active range have settled and are non-empty. */
	isReady: boolean;
};

/**
 * Widget action that fetches the linked report's full rows on click and saves its CSV.
 *
 * @return The rendered action, or null until the widget has rows to back it.
 */
export function FullReportCsvDownloadButton< TItem, TRow >( {
	exporter,
	isReady,
	...buttonProps
}: FullReportCsvDownloadButtonProps< TItem, TRow > ) {
	const { reportParams } = useWidgetRootContext();

	if ( ! isReady || ! isCsvExportEnabled() ) {
		return null;
	}

	return (
		<CsvDownloadButton
			{ ...buttonProps }
			onDownload={ () => downloadReportCsv( exporter, reportParams ) }
		/>
	);
}

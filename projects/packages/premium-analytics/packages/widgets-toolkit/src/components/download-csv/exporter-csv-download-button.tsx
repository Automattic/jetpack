/**
 * Internal dependencies
 */
import {
	eraseExporterRowTypes,
	reportCsvExporters,
	type ExportableReport,
} from '../../report-exports/by-report';
import { useExporterCsvAction, type UseExporterCsvActionOptions } from './csv-download-action';
import { CsvDownloadButton, type CsvDownloadButtonProps } from './csv-download-button';
import type { ReportCsvExporter } from '../../report-exports/types';

type ExporterCsvDownloadButtonProps< TItem, TRow > = Omit<
	CsvDownloadButtonProps,
	'onDownload' | 'label' | 'icon'
> &
	Omit< UseExporterCsvActionOptions< TItem, TRow >, 'exporter' > & {
		/**
		 * The linked report's exporter. A widget outside the dashboard names the report instead.
		 */
		exporter?: ReportCsvExporter< TItem, TRow >;
		/**
		 * Id of the linked report, e.g. `videos`, for a widget that holds no exporter.
		 */
		report?: ExportableReport;
	};

/** Widget action that downloads the linked report's full CSV once the widget's rows settle. */
export function ExporterCsvDownloadButton< TItem, TRow >( {
	exporter,
	report,
	status,
	rowCount,
	...buttonProps
}: ExporterCsvDownloadButtonProps< TItem, TRow > ) {
	const action = useExporterCsvAction( {
		exporter: exporter ? eraseExporterRowTypes( exporter ) : report && reportCsvExporters[ report ],
		status,
		rowCount,
	} );

	if ( ! action ) {
		return null;
	}

	return (
		<CsvDownloadButton
			{ ...buttonProps }
			label={ action.label }
			icon={ action.icon }
			onDownload={ action.callback }
		/>
	);
}

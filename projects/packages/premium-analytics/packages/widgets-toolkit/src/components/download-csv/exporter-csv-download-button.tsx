/**
 * Internal dependencies
 */
import { useExporterCsvAction, type UseExporterCsvActionOptions } from './csv-download-action';
import { CsvDownloadButton, type CsvDownloadButtonProps } from './csv-download-button';

type ExporterCsvDownloadButtonProps< TItem, TRow > = Omit<
	CsvDownloadButtonProps,
	'onDownload' | 'label'
> &
	UseExporterCsvActionOptions< TItem, TRow >;

/** Widget action that downloads the linked report's full CSV once the widget's rows settle. */
export function ExporterCsvDownloadButton< TItem, TRow >( {
	exporter,
	status,
	rowCount,
	...buttonProps
}: ExporterCsvDownloadButtonProps< TItem, TRow > ) {
	const action = useExporterCsvAction( { exporter, status, rowCount } );

	if ( ! action ) {
		return null;
	}

	return (
		<CsvDownloadButton { ...buttonProps } label={ action.label } onDownload={ action.callback } />
	);
}

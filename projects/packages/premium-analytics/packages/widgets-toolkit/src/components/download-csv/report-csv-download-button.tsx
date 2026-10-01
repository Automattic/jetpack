/**
 * Internal dependencies
 */
import {
	useServerReportCsvAction,
	type UseServerReportCsvActionOptions,
} from './csv-download-action';
import { CsvDownloadButton, type CsvDownloadButtonProps } from './csv-download-button';

export type ReportCsvDownloadButtonProps = Omit<
	CsvDownloadButtonProps,
	'onDownload' | 'label' | 'icon'
> &
	UseServerReportCsvActionOptions;

/**
 * Download a complete server-generated report as CSV.
 *
 * @return The rendered action, or null when exports are unavailable.
 */
export function ReportCsvDownloadButton( {
	reportType,
	reportParams,
	...buttonProps
}: ReportCsvDownloadButtonProps ) {
	const action = useServerReportCsvAction( { reportType, reportParams } );

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

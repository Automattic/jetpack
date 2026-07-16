/**
 * External dependencies
 */
import { downloadReport, type ReportParams } from '@jetpack-premium-analytics/data';
import { useContext } from 'react';
/**
 * Internal dependencies
 */
import { WidgetRootContext } from '../widget-root';
import { CsvDownloadButton, type CsvDownloadButtonProps } from './csv-download-button';
import { isCsvExportEnabled } from './is-csv-export-enabled';
import { toDownloadReportParams } from './to-download-report-params';

export type ReportCsvDownloadButtonProps = Omit< CsvDownloadButtonProps, 'onDownload' > & {
	/**
	 * A report key supported by the ported WooCommerce Analytics export endpoint.
	 */
	reportType: string;

	/**
	 * Optional report parameters. Defaults to the surrounding WidgetRoot context.
	 */
	reportParams?: ReportParams;
};

/**
 * Download a complete server-generated report as CSV.
 *
 * @param props              - Component props.
 * @param props.reportType   - Report key supported by the export endpoint.
 * @param props.reportParams - Optional report params override.
 * @return The rendered action, or null when exports are unavailable.
 */
export function ReportCsvDownloadButton( {
	reportType,
	reportParams,
	...buttonProps
}: ReportCsvDownloadButtonProps ) {
	const context = useContext( WidgetRootContext );

	if ( ! isCsvExportEnabled() ) {
		return null;
	}

	const resolvedReportParams = reportParams ?? context?.reportParams;
	if ( ! resolvedReportParams ) {
		if ( process.env.NODE_ENV !== 'production' ) {
			// eslint-disable-next-line no-console -- Surface a developer integration error without taking down the widget.
			console.warn( 'ReportCsvDownloadButton requires reportParams or a surrounding WidgetRoot.' );
		}
		return null;
	}

	return (
		<CsvDownloadButton
			{ ...buttonProps }
			onDownload={ () =>
				downloadReport( toDownloadReportParams( reportType, resolvedReportParams ) )
			}
		/>
	);
}

/**
 * External dependencies
 */
import { downloadReport, type ReportParams } from '@jetpack-premium-analytics/data';
import { __ } from '@wordpress/i18n';
import { download } from '@wordpress/icons';
import { useContext, useState, type ReactElement } from 'react';
/**
 * Internal dependencies
 */
import { downloadReportCsv } from '../../report-exports/download-report-csv';
import { WidgetRootContext, useWidgetRootContext } from '../widget-root';
import { isCsvExportEnabled } from './is-csv-export-enabled';
import { toDownloadReportParams } from './to-download-report-params';
import { useDownloadWithErrorNotice } from './use-download-with-error-notice';
import { isReportCsvReady, type ReportCsvExportStatus } from './use-report-csv-export';
import type { ReportCsvExporter } from '../../report-exports/types';

/** A widget's CSV download, assignable to `WidgetCallbackAction` from WordPress/gutenberg#83877. */
export type CsvDownloadAction = {
	id: string;
	label: string;
	icon: ReactElement;
	/** Never rejects: the dashboard's action runner reports no failure, so this shows the snackbar. */
	callback: () => Promise< void >;
};

function useCsvDownloadAction(
	startDownload: ( () => Promise< unknown > ) | null
): CsvDownloadAction | null {
	const callback = useDownloadWithErrorNotice( () => startDownload?.() );

	if ( ! startDownload ) {
		return null;
	}

	return {
		id: 'download-csv',
		label: __( 'Download CSV', 'jetpack-premium-analytics-pkg' ),
		icon: download,
		callback,
	};
}

export type UseExporterCsvActionOptions< TItem, TRow > = {
	exporter: ReportCsvExporter< TItem, TRow >;
	/** The widget's own request state for the active range. */
	status: ReportCsvExportStatus;
	/** How many rows the widget shows; an empty widget offers no download. */
	rowCount: number;
};

/** The linked report's full CSV download, or null until the widget's rows settle. */
export function useExporterCsvAction< TItem, TRow >( {
	exporter,
	status,
	rowCount,
}: UseExporterCsvActionOptions< TItem, TRow > ): CsvDownloadAction | null {
	const { reportParams } = useWidgetRootContext();
	// The download can refetch the widget's own query; unmounting the button then drops focus.
	const [ isDownloading, setIsDownloading ] = useState( false );

	return useCsvDownloadAction(
		isDownloading || isReportCsvReady( status, rowCount )
			? async () => {
					setIsDownloading( true );
					try {
						await downloadReportCsv( exporter, reportParams );
					} finally {
						setIsDownloading( false );
					}
				}
			: null
	);
}

export type UseServerReportCsvActionOptions = {
	/** A report key supported by the ported WooCommerce Analytics export endpoint. */
	reportType: string;
	/** Defaults to the surrounding WidgetRoot context. */
	reportParams?: ReportParams;
};

/** The server-generated report download, or null when exports are unavailable. */
export function useServerReportCsvAction( {
	reportType,
	reportParams,
}: UseServerReportCsvActionOptions ): CsvDownloadAction | null {
	const context = useContext( WidgetRootContext );
	const isEnabled = isCsvExportEnabled();
	const resolvedReportParams = reportParams ?? context?.reportParams;

	if ( isEnabled && ! resolvedReportParams && process.env.NODE_ENV !== 'production' ) {
		// eslint-disable-next-line no-console -- Surface a developer integration error without taking down the widget.
		console.warn( 'useServerReportCsvAction requires reportParams or a surrounding WidgetRoot.' );
	}

	return useCsvDownloadAction(
		isEnabled && resolvedReportParams
			? () => downloadReport( toDownloadReportParams( reportType, resolvedReportParams ) )
			: null
	);
}

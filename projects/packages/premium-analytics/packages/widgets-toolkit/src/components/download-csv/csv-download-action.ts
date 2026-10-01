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
import { isReportCsvReady, type ReportCsvExportStatus } from './use-report-csv-export';
import type { ReportCsvExporter } from '../../report-exports/types';

/** A widget's CSV download, shaped like the dashboard's `WidgetCallbackAction`. */
export type CsvDownloadAction = {
	id: string;
	label: string;
	icon: ReactElement;
	/** May reject: whatever renders the action reports the failure. */
	callback: () => Promise< unknown >;
};

function toCsvDownloadAction( callback: () => Promise< unknown > ): CsvDownloadAction {
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
	// The download can refetch the widget's own query, which must not unmount its button.
	const [ isDownloading, setIsDownloading ] = useState( false );

	if ( ! isDownloading && ! isReportCsvReady( status, rowCount ) ) {
		return null;
	}

	return toCsvDownloadAction( async () => {
		setIsDownloading( true );
		try {
			await downloadReportCsv( exporter, reportParams );
		} finally {
			setIsDownloading( false );
		}
	} );
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

	return toCsvDownloadAction( () =>
		downloadReport( toDownloadReportParams( reportType, resolvedReportParams ) )
	);
}

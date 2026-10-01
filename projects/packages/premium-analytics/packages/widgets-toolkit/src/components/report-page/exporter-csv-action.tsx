/**
 * External dependencies
 */
import { useMemo } from 'react';
/**
 * Internal dependencies
 */
import { getReportCsvFilename } from '../../report-exports/download-report-csv';
import {
	isReportCsvReady,
	type ReportCsvExportStatus,
} from '../download-csv/use-report-csv-export';
import { ReportCsvAction } from './report-csv-action';
import type { ReportCsvExporter } from '../../report-exports/types';
import type { ReportParams } from '@jetpack-premium-analytics/data';

type ExporterCsvActionProps< TItem, TRow > = {
	exporter: ReportCsvExporter< TItem, TRow >;
	/** The report's loaded table rows. */
	items: TItem[];
	status: ReportCsvExportStatus;
	/** Required when the exporter has a date range. */
	reportParams?: ReportParams;
};

/** Report header action that saves the settled rows through the report's exporter. */
export function ExporterCsvAction< TItem, TRow >( {
	exporter,
	items,
	status,
	reportParams,
}: ExporterCsvActionProps< TItem, TRow > ) {
	const rows = useMemo( () => exporter.toCsvRows( items ), [ exporter, items ] );
	const columns = useMemo( () => exporter.getColumns(), [ exporter ] );

	if ( ! isReportCsvReady( status, rows.length ) ) {
		return null;
	}

	return (
		<ReportCsvAction
			columns={ columns }
			rows={ rows }
			filename={ getReportCsvFilename( exporter, reportParams ) }
		/>
	);
}

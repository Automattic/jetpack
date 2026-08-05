/**
 * External dependencies
 */
import { useMemo } from 'react';
/**
 * Internal dependencies
 */
import { buildCsvDateRangeFilename, type CsvDateRange } from '../../helpers/build-csv';
import { isCsvExportEnabled } from './is-csv-export-enabled';

type ReportCsvExportStatus = {
	isLoading: boolean;
	isFetching: boolean;
	isError: boolean;
};

export type UseReportCsvExportOptions< Row > = {
	/** Rows already loaded in the browser to serialize. */
	rows: Row[];

	/** Report-specific prefix for the date-stamped filename. */
	filenamePrefix: string;

	/** Active report date range. Omit for reports that cover all time. */
	range?: CsvDateRange;

	/** Active report request state. */
	status: ReportCsvExportStatus;

	/**
	 * Optional export ordering. The source rows are never mutated. Pass a stable
	 * function reference to preserve memoization between renders.
	 */
	sort?: ( a: Row, b: Row ) => number;
};

export type UseReportCsvExportResult< Row > = {
	/** Whether the report action should be rendered. */
	canExport: boolean;

	/** Rows to serialize, optionally sorted without mutating the source rows. */
	rows: Row[];

	/** Date-stamped filename without an extension. */
	filename: string;
};

/**
 * Build a report CSV action from loaded rows and the active request state.
 *
 * @param options                - Report CSV export configuration.
 * @param options.rows           - Loaded report rows.
 * @param options.filenamePrefix - Report-specific filename prefix.
 * @param options.range          - Active report date range.
 * @param options.status         - Active report request state.
 * @param options.sort           - Optional export ordering with a stable function reference.
 * @return Export visibility, rows, and filename.
 */
export function useReportCsvExport< Row >( {
	rows,
	filenamePrefix,
	range,
	status,
	sort,
}: UseReportCsvExportOptions< Row > ): UseReportCsvExportResult< Row > {
	const exportRows = useMemo( () => ( sort ? [ ...rows ].sort( sort ) : rows ), [ rows, sort ] );
	const filename = range ? buildCsvDateRangeFilename( filenamePrefix, range ) : filenamePrefix;
	const canExport =
		isCsvExportEnabled() &&
		exportRows.length > 0 &&
		! status.isLoading &&
		! status.isFetching &&
		! status.isError;

	return {
		canExport,
		rows: exportRows,
		filename,
	};
}

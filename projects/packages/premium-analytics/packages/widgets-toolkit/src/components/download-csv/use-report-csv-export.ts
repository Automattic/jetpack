/**
 * External dependencies
 */
import { useMemo } from 'react';
/**
 * Internal dependencies
 */
import { buildCsvDateRangeFilename, type CsvColumn } from '../../helpers/build-csv';
import { isCsvExportEnabled } from './is-csv-export-enabled';
import type { RowsCsvDownloadButtonProps } from './rows-csv-download-button';

type ReportCsvExportRange = {
	from: string | number;
	to: string | number;
};

type ReportCsvExportStatus = {
	isLoading: boolean;
	isFetching: boolean;
	isError: boolean;
};

export type UseReportCsvExportOptions< Row > = {
	/** Column definitions driving the header and cell order. */
	columns: CsvColumn< Row >[];

	/** Rows already loaded in the browser to serialize. */
	rows: Row[];

	/** Report-specific prefix for the date-stamped filename. */
	filenamePrefix: string;

	/** Active report date range. Omit for reports that cover all time. */
	range?: ReportCsvExportRange;

	/** Active report request state. */
	status: ReportCsvExportStatus;

	/** Optional export ordering. The source rows are never mutated. */
	sort?: ( a: Row, b: Row ) => number;
};

export type UseReportCsvExportResult< Row > = {
	/** Whether the report action should be rendered. */
	canExport: boolean;

	/** Data props for RowsCsvDownloadButton. */
	buttonProps: Pick< RowsCsvDownloadButtonProps< Row >, 'columns' | 'rows' | 'filename' >;
};

/**
 * Build a report CSV action from loaded rows and the active request state.
 *
 * @param options                - Report CSV export configuration.
 * @param options.columns        - CSV column definitions.
 * @param options.rows           - Loaded report rows.
 * @param options.filenamePrefix - Report-specific filename prefix.
 * @param options.range          - Active report date range.
 * @param options.status         - Active report request state.
 * @param options.sort           - Optional export ordering.
 * @return Export visibility and RowsCsvDownloadButton data props.
 */
export function useReportCsvExport< Row >( {
	columns,
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
		buttonProps: {
			columns,
			rows: exportRows,
			filename,
		},
	};
}

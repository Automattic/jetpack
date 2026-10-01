/**
 * Internal dependencies
 */
import type { CsvColumn } from '../helpers/build-csv';
import type { ReportParams } from '@jetpack-premium-analytics/data';

type ReportCsvExporterShape< TItem, TRow > = {
	filenamePrefix: string;
	/** Flatten, label, and order rows exactly as the page's CSV does. */
	toCsvRows: ( items: TItem[] ) => TRow[];
	getColumns: () => CsvColumn< TRow >[];
};

/** A report scoped to the selected dates; its filename carries the range. */
export type DatedReportCsvExporter< TItem, TRow > = ReportCsvExporterShape< TItem, TRow > & {
	hasDateRange: true;
	/** Fetch the report's full primary rows, as its page loads them. */
	fetchItems: ( reportParams: ReportParams ) => Promise< TItem[] >;
};

/** A report the date filters do not scope (all-time or a fixed window). */
export type UndatedReportCsvExporter< TItem, TRow > = ReportCsvExporterShape< TItem, TRow > & {
	hasDateRange: false;
	/** Fetch the report's full rows, as its page loads them. */
	fetchItems: () => Promise< TItem[] >;
};

/** One report's CSV contract, shared by its page and the widgets that link to it. */
export type ReportCsvExporter< TItem, TRow > =
	DatedReportCsvExporter< TItem, TRow > | UndatedReportCsvExporter< TItem, TRow >;

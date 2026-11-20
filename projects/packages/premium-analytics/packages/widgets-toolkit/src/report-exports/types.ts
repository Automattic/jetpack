/**
 * Internal dependencies
 */
import type { CsvColumn } from '../helpers/build-csv';
import type { ReportParams } from '@jetpack-premium-analytics/data';

/** One report's CSV contract, shared by its page and the widgets that link to it. */
export type ReportCsvExporter< TItem, TRow > = {
	filenamePrefix: string;
	/** Append a date range or all-time suffix to the filename. */
	hasDateRange: boolean;
	/** Date an All time file too, for an exporter that queries the window's own start. */
	datesAllTime?: boolean;
	/** Fetch the report's full primary rows, as its page loads them. */
	fetchItems: ( reportParams: ReportParams ) => Promise< TItem[] >;
	/** Flatten, label, and order rows exactly as the page's CSV does. */
	toCsvRows: ( items: TItem[] ) => TRow[];
	getColumns: () => CsvColumn< TRow >[];
};

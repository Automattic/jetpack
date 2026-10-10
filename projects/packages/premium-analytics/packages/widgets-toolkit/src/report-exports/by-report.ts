/**
 * Internal dependencies
 */
import { authorsCsvExporter } from './authors';
import { clicksCsvExporter } from './clicks';
import { fileDownloadsCsvExporter } from './file-downloads';
import { referrersCsvExporter } from './referrers';
import { searchTermsCsvExporter } from './search-terms';
import { videosCsvExporter } from './videos';
import type { ReportCsvExporter } from './types';

/**
 * Erase an exporter's row types: a widget names the report, the exporter keeps its rows to itself.
 *
 * @param exporter - A report's CSV exporter.
 * @return The same exporter, untyped.
 */
export function eraseExporterRowTypes< TItem, TRow >(
	exporter: ReportCsvExporter< TItem, TRow >
): ReportCsvExporter< unknown, unknown > {
	return exporter as unknown as ReportCsvExporter< unknown, unknown >;
}

/** The CSV of each report a widget can name by id. Posts has one per tab, so it is not here. */
export const reportCsvExporters = {
	authors: eraseExporterRowTypes( authorsCsvExporter ),
	clicks: eraseExporterRowTypes( clicksCsvExporter ),
	downloads: eraseExporterRowTypes( fileDownloadsCsvExporter ),
	referrers: eraseExporterRowTypes( referrersCsvExporter ),
	'search-terms': eraseExporterRowTypes( searchTermsCsvExporter ),
	videos: eraseExporterRowTypes( videosCsvExporter ),
};

export type ExportableReport = keyof typeof reportCsvExporters;

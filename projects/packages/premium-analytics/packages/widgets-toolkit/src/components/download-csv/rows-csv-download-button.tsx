/**
 * Internal dependencies
 */
import { buildCsv, saveCsv, type CsvColumn } from '../../helpers/build-csv';
import { CsvDownloadButton, type CsvDownloadButtonProps } from './csv-download-button';
import { isCsvExportEnabled } from './is-csv-export-enabled';

export type RowsCsvDownloadButtonProps< Row > = Omit< CsvDownloadButtonProps, 'onDownload' > & {
	/**
	 * Column definitions driving the header and cell order.
	 */
	columns: CsvColumn< Row >[];

	/**
	 * Rows already loaded in the browser to serialize.
	 */
	rows: Row[];

	/**
	 * File name (without extension) for the download.
	 */
	filename: string;
};

/**
 * Serialize rows already loaded in the browser and download them as CSV.
 *
 * @return The rendered action, or null when there is nothing to export.
 */
export function RowsCsvDownloadButton< Row >( {
	columns,
	rows,
	filename,
	...buttonProps
}: RowsCsvDownloadButtonProps< Row > ) {
	if ( ! isCsvExportEnabled() || rows.length === 0 ) {
		return null;
	}

	const onDownload = async () => {
		// Let React commit the loading state before the synchronous CSV build
		// and browser download handoff begin.
		await new Promise< void >( resolve => setTimeout( resolve, 0 ) );
		saveCsv( filename, buildCsv( columns, rows ) );
	};

	return <CsvDownloadButton { ...buttonProps } onDownload={ onDownload } />;
}

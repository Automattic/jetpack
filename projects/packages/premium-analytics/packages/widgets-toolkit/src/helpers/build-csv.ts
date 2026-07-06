/**
 * Client-side CSV helpers.
 *
 * Mirrors the Jetpack Stats "Download CSV" model: serialize rows that are
 * already loaded in the browser (no backend round-trip) and hand the file to
 * the user. Serialization is a pure function so it can be unit tested; the
 * download step reuses the Blob + anchor idiom from Jetpack Forms
 * (`packages/forms/src/dashboard/components/export-responses/csv.tsx`).
 */

/**
 * A single CSV column: which row key to read and the header label to print.
 */
export type CsvColumn< Row > = {
	/**
	 * Row property to serialize for this column.
	 */
	key: keyof Row & string;

	/**
	 * Header label printed on the first line.
	 */
	label: string;
};

/**
 * Quote and escape a single field for CSV output.
 *
 * Every field is wrapped in double quotes and any embedded quote is doubled,
 * matching the Calypso Stats `DownloadCsv` behavior. This keeps commas,
 * newlines, and quotes inside values from breaking the row.
 *
 * @param value - The raw cell value.
 * @return The quoted, escaped field.
 */
function escapeField( value: unknown ): string {
	return `"${ String( value ?? '' ).replace( /"/g, '""' ) }"`;
}

/**
 * Serialize already-loaded rows into a CSV string.
 *
 * @param columns - Column definitions (order preserved, drives the header).
 * @param rows    - The rows to serialize; each is read by column `key`.
 * @return The CSV text (header row followed by one line per row).
 */
export function buildCsv< Row extends Record< string, unknown > >(
	columns: CsvColumn< Row >[],
	rows: Row[]
): string {
	const header = columns.map( column => escapeField( column.label ) ).join( ',' );
	const body = rows.map( row =>
		columns.map( column => escapeField( row[ column.key ] ) ).join( ',' )
	);

	return [ header, ...body ].join( '\n' );
}

/**
 * Trigger a browser download of the given CSV text.
 *
 * @param filename - Desired file name; a `.csv` extension is added if missing.
 * @param csv      - The CSV text to download.
 */
export function saveCsv( filename: string, csv: string ): void {
	const blob = new Blob( [ csv ], { type: 'text/csv;charset=utf-8' } );
	const url = window.URL.createObjectURL( blob );
	const link = document.createElement( 'a' );

	link.href = url;
	link.download = filename.toLowerCase().endsWith( '.csv' ) ? filename : `${ filename }.csv`;

	document.body.appendChild( link );
	link.click();
	document.body.removeChild( link );
	window.URL.revokeObjectURL( url );
}

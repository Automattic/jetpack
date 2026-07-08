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
 * Strings starting with `=`, `+`, `-`, `@`, tab, or CR are prefixed with a
 * single quote so spreadsheet apps render them as text instead of executing
 * them as formulas (CSV formula injection; titles and URLs are content data).
 * Finite numbers and bigints are exempt so numeric cells stay parseable;
 * non-finite numbers (`Infinity`, `NaN`) fall through to neutralization so a
 * leading `-` is never left unescaped.
 *
 * @param value - The raw cell value.
 * @return The quoted, escaped field.
 */
function escapeField( value: unknown ): string {
	let str = String( value ?? '' );

	const isNumeric =
		( typeof value === 'number' && Number.isFinite( value ) ) || typeof value === 'bigint';
	if ( ! isNumeric && /^[=+\-@\t\r]/.test( str ) ) {
		str = `'${ str }`;
	}

	return `"${ str.replace( /"/g, '""' ) }"`;
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
 * The blob is prefixed with a UTF-8 BOM so Excel on Windows decodes non-ASCII
 * content correctly, and the object URL is revoked on the next tick because
 * Safari has aborted downloads when the URL is revoked in the same tick as the
 * click.
 *
 * @param filename - Desired file name; a `.csv` extension is added if missing.
 * @param csv      - The CSV text to download.
 */
export function saveCsv( filename: string, csv: string ): void {
	const blob = new Blob( [ '\ufeff', csv ], { type: 'text/csv;charset=utf-8' } );
	const url = window.URL.createObjectURL( blob );
	const link = document.createElement( 'a' );
	// Replace path separators, control characters, and Windows-reserved characters.
	// Fall back to a generic name so an empty (or fully-stripped) input can't
	// produce a hidden `.csv` dotfile.
	// eslint-disable-next-line no-control-regex
	const safeName = filename.replace( /[\x00-\x1f/\\:*?"<>|]/g, '-' ) || 'export';

	link.href = url;
	link.download = safeName.toLowerCase().endsWith( '.csv' ) ? safeName : `${ safeName }.csv`;

	document.body.appendChild( link );
	link.click();
	document.body.removeChild( link );
	setTimeout( () => window.URL.revokeObjectURL( url ), 0 );
}

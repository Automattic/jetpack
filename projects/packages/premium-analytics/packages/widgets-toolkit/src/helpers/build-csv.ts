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
 * External dependencies
 */
import { saveBlob } from '@jetpack-premium-analytics/data';
import { getDatePart } from '@jetpack-premium-analytics/datetime';
import { __, sprintf } from '@wordpress/i18n';

/**
 * A single CSV column: how to read a row value and the header label to print.
 */
export type CsvColumn< Row > = {
	/**
	 * Read the raw value to serialize for this column.
	 */
	getValue: ( row: Row ) => unknown;

	/**
	 * Header label printed on the first line.
	 */
	label: string;

	/**
	 * Read the previous-period value. Inert unless the columns are passed
	 * through `withComparisonColumns()`; `buildCsv` itself never reads it.
	 */
	getPreviousValue?: ( row: Row ) => number | undefined;
};

/**
 * Append previous-period columns for an active comparison.
 *
 * Column labels and ordering follow the server-side WooCommerce export.
 * Missing values stay blank rather than `0`: both periods are ranked and capped
 * independently, so an absent row means "outside the comparison period's top
 * rows", not a measured zero.
 *
 * @param columns       - Primary columns; those with `getPreviousValue` gain a twin.
 * @param hasComparison - Whether the report loaded comparison rows.
 * @return The columns to serialize.
 */
export function withComparisonColumns< Row >(
	columns: CsvColumn< Row >[],
	hasComparison: boolean
): CsvColumn< Row >[] {
	if ( ! hasComparison ) {
		return columns;
	}

	const comparisonColumns = columns.flatMap( column => {
		const getPreviousValue = column.getPreviousValue;
		if ( ! getPreviousValue ) {
			return [];
		}

		return [
			{
				label: sprintf(
					/* translators: %s: the column label, e.g. "Views". */
					__( '%s (Previous Period)', 'jetpack-premium-analytics-pkg' ),
					column.label
				),
				getValue: getPreviousValue,
			},
		];
	} );

	return comparisonColumns.length ? [ ...columns, ...comparisonColumns ] : columns;
}

/**
 * Date range used to label a CSV export.
 */
export type CsvDateRange = {
	from: string | number;
	to: string | number;
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
 * @param rows    - The rows to serialize; each is read by column `getValue`.
 * @return The CSV text (header row followed by one line per row).
 */
export function buildCsv< Row >( columns: CsvColumn< Row >[], rows: Row[] ): string {
	const header = columns.map( column => escapeField( column.label ) ).join( ',' );
	const body = rows.map( row =>
		columns.map( column => escapeField( column.getValue( row ) ) ).join( ',' )
	);

	return [ header, ...body ].join( '\n' );
}

/**
 * Build a date-stamped filename for a CSV export.
 *
 * The dates are coerced to strings because the router JSON-parses search
 * parameters, so a hand-edited numeric value must not throw on `.slice()`.
 *
 * @param prefix     - Report-specific filename prefix.
 * @param range      - Report date range.
 * @param range.from - Start of the report date range.
 * @param range.to   - End of the report date range.
 * @return The filename without its `.csv` extension.
 */
export function buildCsvDateRangeFilename( prefix: string, range: CsvDateRange ): string {
	const from = getDatePart( range.from ) ?? String( range.from );
	const to = getDatePart( range.to ) ?? String( range.to );
	return `${ prefix }-${ from }_${ to }`;
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
	saveBlob( blob, filename );
}

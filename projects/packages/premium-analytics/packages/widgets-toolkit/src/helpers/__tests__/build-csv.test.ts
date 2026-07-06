/**
 * Internal dependencies
 */
import { buildCsv, type CsvColumn } from '../build-csv';

type Row = {
	label: string;
	value: number;
	href: string;
};

const columns: CsvColumn< Row >[] = [
	{ key: 'label', label: 'Title' },
	{ key: 'value', label: 'Views' },
	{ key: 'href', label: 'URL' },
];

describe( 'buildCsv', () => {
	it( 'emits a header row from the column labels', () => {
		const csv = buildCsv( columns, [] );
		expect( csv ).toBe( '"Title","Views","URL"' );
	} );

	it( 'serializes rows in column order', () => {
		const csv = buildCsv( columns, [
			{ label: 'Hello world!', value: 4, href: 'https://example.com/hello' },
		] );
		expect( csv ).toBe( '"Title","Views","URL"\n"Hello world!","4","https://example.com/hello"' );
	} );

	it( 'quotes and escapes commas, quotes, and newlines', () => {
		const csv = buildCsv( columns, [
			{ label: 'A, "quoted"\nvalue', value: 1, href: 'https://example.com' },
		] );
		// Comma stays inside the quoted field, embedded quotes are doubled,
		// and the newline is preserved inside the quotes.
		expect( csv ).toBe( '"Title","Views","URL"\n"A, ""quoted""\nvalue","1","https://example.com"' );
	} );

	it( 'renders null and undefined cells as empty strings', () => {
		const sparseColumns: CsvColumn< Record< string, unknown > >[] = [
			{ key: 'a', label: 'A' },
			{ key: 'b', label: 'B' },
		];
		const csv = buildCsv( sparseColumns, [ { a: null, b: undefined } ] );
		expect( csv ).toBe( '"A","B"\n"",""' );
	} );
} );

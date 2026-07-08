/**
 * Internal dependencies
 */
import { buildCsv, saveCsv, type CsvColumn } from '../build-csv';

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

	it.each( [
		[ '=HYPERLINK("https://evil.example","x")', '"\'=HYPERLINK(""https://evil.example"",""x"")"' ],
		[ '+1234', '"\'+1234"' ],
		[ '-payload', '"\'-payload"' ],
		[ '@cmd', '"\'@cmd"' ],
		[ '\tindented', '"\'\tindented"' ],
		[ '\rreturn', '"\'\rreturn"' ],
	] )( 'neutralizes formula injection for %j', ( input, expected ) => {
		const csv = buildCsv( [ { key: 'a', label: 'A' } ], [ { a: input } ] );
		expect( csv.split( '\n' )[ 1 ] ).toBe( expected );
	} );

	it( 'does not prefix negative numbers', () => {
		const csv = buildCsv( [ { key: 'a', label: 'A' } ], [ { a: -12 } ] );
		expect( csv.split( '\n' )[ 1 ] ).toBe( '"-12"' );
	} );

	it( 'does not prefix negative bigints', () => {
		const csv = buildCsv( [ { key: 'a', label: 'A' } ], [ { a: -12n } ] );
		expect( csv.split( '\n' )[ 1 ] ).toBe( '"-12"' );
	} );

	it( 'neutralizes non-finite numbers that start with a sign', () => {
		const csv = buildCsv( [ { key: 'a', label: 'A' } ], [ { a: -Infinity } ] );
		expect( csv.split( '\n' )[ 1 ] ).toBe( '"\'-Infinity"' );
	} );
} );

describe( 'saveCsv', () => {
	let createObjectURL: jest.Mock;
	let revokeObjectURL: jest.Mock;
	let clickSpy: jest.SpyInstance;
	let downloads: string[];
	let originalCreateObjectURL: typeof window.URL.createObjectURL;
	let originalRevokeObjectURL: typeof window.URL.revokeObjectURL;

	beforeEach( () => {
		jest.useFakeTimers();
		originalCreateObjectURL = window.URL.createObjectURL;
		originalRevokeObjectURL = window.URL.revokeObjectURL;
		createObjectURL = jest.fn( () => 'blob:mock' );
		revokeObjectURL = jest.fn();
		window.URL.createObjectURL = createObjectURL;
		window.URL.revokeObjectURL = revokeObjectURL;
		// Anchor clicks would trigger jsdom's unimplemented navigation.
		downloads = [];
		clickSpy = jest.spyOn( HTMLAnchorElement.prototype, 'click' ).mockImplementation( function (
			this: HTMLAnchorElement
		) {
			downloads.push( this.download );
		} );
	} );

	afterEach( () => {
		clickSpy.mockRestore();
		window.URL.createObjectURL = originalCreateObjectURL;
		window.URL.revokeObjectURL = originalRevokeObjectURL;
		jest.clearAllTimers();
		jest.useRealTimers();
	} );

	it( 'prefixes the blob with a UTF-8 BOM', async () => {
		saveCsv( 'report', '"A"' );
		const blob = createObjectURL.mock.calls[ 0 ][ 0 ] as Blob;

		// Read raw bytes: text decoding would consume the BOM. FileReader needs
		// real timers to deliver its load event.
		jest.useRealTimers();
		const bytes = await new Promise< Uint8Array >( resolve => {
			const reader = new FileReader();
			reader.onload = () => resolve( new Uint8Array( reader.result as ArrayBuffer ) );
			reader.readAsArrayBuffer( blob );
		} );
		expect( Array.from( bytes.slice( 0, 3 ) ) ).toEqual( [ 0xef, 0xbb, 0xbf ] );
	} );

	it( 'appends .csv when missing and keeps an existing extension', () => {
		saveCsv( 'report', '"A"' );
		saveCsv( 'report.CSV', '"A"' );
		expect( downloads ).toEqual( [ 'report.csv', 'report.CSV' ] );
	} );

	it( 'replaces path separators and reserved characters in the filename', () => {
		saveCsv( 'a/b:c', '"A"' );
		expect( downloads ).toEqual( [ 'a-b-c.csv' ] );
	} );

	it( 'falls back to export.csv when the filename is empty', () => {
		saveCsv( '', '"A"' );
		expect( downloads ).toEqual( [ 'export.csv' ] );
	} );

	it( 'marks the blob as UTF-8 CSV', () => {
		saveCsv( 'report', '"A"' );
		const blob = createObjectURL.mock.calls[ 0 ][ 0 ] as Blob;
		expect( blob.type ).toBe( 'text/csv;charset=utf-8' );
	} );

	it( 'revokes the object URL on the next tick, not synchronously', () => {
		saveCsv( 'report', '"A"' );
		expect( revokeObjectURL ).not.toHaveBeenCalled();
		jest.runAllTimers();
		expect( revokeObjectURL ).toHaveBeenCalledWith( 'blob:mock' );
	} );
} );

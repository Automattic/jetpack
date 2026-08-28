/**
 * Internal dependencies
 */
import {
	buildCsv,
	buildCsvDateRangeFilename,
	saveCsv,
	withComparisonColumns,
	type CsvColumn,
} from '../build-csv';

type Row = {
	label: string;
	value: number;
	href: string;
};

const columns: CsvColumn< Row >[] = [
	{ label: 'Title', getValue: row => row.label },
	{ label: 'Views', getValue: row => row.value },
	{ label: 'URL', getValue: row => row.href },
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
			{ label: 'A', getValue: row => row.a },
			{ label: 'B', getValue: row => row.b },
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
		const csv = buildCsv( [ { label: 'A', getValue: row => row.a } ], [ { a: input } ] );
		expect( csv.split( '\n' )[ 1 ] ).toBe( expected );
	} );

	it( 'does not prefix negative numbers', () => {
		const csv = buildCsv( [ { label: 'A', getValue: row => row.a } ], [ { a: -12 } ] );
		expect( csv.split( '\n' )[ 1 ] ).toBe( '"-12"' );
	} );

	it( 'does not prefix negative bigints', () => {
		const csv = buildCsv( [ { label: 'A', getValue: row => row.a } ], [ { a: -12n } ] );
		expect( csv.split( '\n' )[ 1 ] ).toBe( '"-12"' );
	} );

	it( 'neutralizes non-finite numbers that start with a sign', () => {
		const csv = buildCsv( [ { label: 'A', getValue: row => row.a } ], [ { a: -Infinity } ] );
		expect( csv.split( '\n' )[ 1 ] ).toBe( '"\'-Infinity"' );
	} );
} );

describe( 'withComparisonColumns', () => {
	type MetricRow = {
		label: string;
		views: number;
		previousViews?: number;
		plays: number;
		previousPlays?: number;
	};

	const metricColumns: CsvColumn< MetricRow >[] = [
		{ label: 'Title', getValue: row => row.label },
		{ label: 'Views', getValue: row => row.views, getPreviousValue: row => row.previousViews },
		{ label: 'Plays', getValue: row => row.plays, getPreviousValue: row => row.previousPlays },
	];

	it( 'returns the same columns when there is no comparison', () => {
		expect( withComparisonColumns( metricColumns, false ) ).toBe( metricColumns );
	} );

	it( 'appends every comparison column after the primary columns', () => {
		const exported = withComparisonColumns( metricColumns, true );
		expect( exported.map( column => column.label ) ).toEqual( [
			'Title',
			'Views',
			'Plays',
			'Views (Previous Period)',
			'Plays (Previous Period)',
		] );
	} );

	it( 'reads previous values through getPreviousValue', () => {
		const csv = buildCsv( withComparisonColumns( metricColumns, true ), [
			{ label: 'Hello', views: 4, previousViews: 2, plays: 9, previousPlays: 7 },
		] );
		expect( csv.split( '\n' )[ 1 ] ).toBe( '"Hello","4","9","2","7"' );
	} );

	it( 'exports 0 for rows missing from the comparison period', () => {
		const csv = buildCsv( withComparisonColumns( metricColumns, true ), [
			{ label: 'Only now', views: 4, plays: 9 },
		] );
		expect( csv.split( '\n' )[ 1 ] ).toBe( '"Only now","4","9","0","0"' );
	} );

	it( 'leaves columns without a previous value out of the comparison block', () => {
		const exported = withComparisonColumns(
			[ { label: 'Title', getValue: row => row.label } ] as CsvColumn< MetricRow >[],
			true
		);
		expect( exported.map( column => column.label ) ).toEqual( [ 'Title' ] );
	} );
} );

describe( 'buildCsvDateRangeFilename', () => {
	it( 'uses only the date portion of ISO timestamps', () => {
		expect(
			buildCsvDateRangeFilename( 'top-posts', {
				from: '2026-06-01T00:00:00Z',
				to: '2026-06-30T23:59:59Z',
			} )
		).toBe( 'top-posts-2026-06-01_2026-06-30' );
	} );

	it( 'coerces numeric router values to strings', () => {
		expect( buildCsvDateRangeFilename( 'top-posts', { from: 123, to: 456 } ) ).toBe(
			'top-posts-123_456'
		);
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

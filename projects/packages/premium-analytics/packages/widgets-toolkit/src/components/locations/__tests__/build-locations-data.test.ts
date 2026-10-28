/**
 * Internal dependencies
 */
import { buildLocationsData, type LocationRowInput } from '../build-locations-data';

const COUNTRIES: LocationRowInput[] = [
	{ id: 'us', label: 'United States', value: 1200, previousValue: 1000 },
	{ id: 'ca', label: 'Canada', value: 300 },
];

describe( 'buildLocationsData', () => {
	it( 'places countries on the world map, each row under its own flag', () => {
		const { geoRows, geoMode, focusCountry, rows, comparing } = buildLocationsData( COUNTRIES, {
			hasComparison: true,
			maxRows: 10,
		} );

		expect( geoMode ).toBe( 'country' );
		expect( focusCountry ).toBeUndefined();
		expect( geoRows.map( row => row.countryCode ) ).toEqual( [ 'US', 'CA' ] );
		expect( rows.map( row => row.media?.kind === 'flag' && row.media.country ) ).toEqual( [
			'United States',
			'Canada',
		] );
		expect( comparing ).toBe( true );
	} );

	it( 'places regions inside their country, every row under that flag', () => {
		const { geoRows, geoMode, focusCountry, rows } = buildLocationsData(
			[ { id: 'California', label: 'California', value: 500 } ],
			{ country: { code: 'US', name: 'United States' }, hasComparison: false, maxRows: 10 }
		);

		expect( geoMode ).toBe( 'region' );
		expect( focusCountry ).toEqual( { code: 'US', name: 'United States' } );
		expect( geoRows[ 0 ] ).toMatchObject( { countryCode: 'US', countryFull: 'United States' } );
		expect( rows[ 0 ].media ).toMatchObject( { kind: 'flag', country: 'United States' } );
	} );

	it( 'compares only while some row carries a previous figure', () => {
		const rows = COUNTRIES.map( ( { id, label, value } ) => ( { id, label, value } ) );

		expect( buildLocationsData( rows, { hasComparison: true, maxRows: 10 } ).comparing ).toBe(
			false
		);
	} );

	it( 'ignores a previous figure past the visible rows', () => {
		const rows = [
			{ id: 'us', label: 'United States', value: 1200 },
			{ id: 'ca', label: 'Canada', value: 300 },
			{ id: 'jp', label: 'Japan', value: 2, previousValue: 1 },
		];

		expect( buildLocationsData( rows, { hasComparison: true, maxRows: 2 } ).comparing ).toBe(
			false
		);
		expect( buildLocationsData( rows, { hasComparison: true, maxRows: 3 } ).comparing ).toBe(
			true
		);
	} );
} );

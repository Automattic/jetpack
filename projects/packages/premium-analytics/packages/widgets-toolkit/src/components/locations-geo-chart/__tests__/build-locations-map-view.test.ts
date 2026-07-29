/**
 * Internal dependencies
 */
import {
	buildLocationsMapView,
	getGeoChartCountryId,
	type LocationsGeoChartRow,
} from '../build-locations-map-view';

const rows: LocationsGeoChartRow[] = [
	{ label: 'California', countryCode: 'US', countryFull: 'United States', value: 10 },
	{ label: 'Texas', countryCode: 'us', countryFull: 'United States', value: 4 },
	{ label: 'Ontario', countryCode: 'CA', countryFull: 'Canada', value: 3 },
];

describe( 'getGeoChartCountryId', () => {
	it( 'maps Taiwan to the name Google GeoChart resolves', () => {
		expect( getGeoChartCountryId( 'tw' ) ).toBe( 'Taiwan' );
	} );

	it( 'upper-cases every other country code', () => {
		expect( getGeoChartCountryId( 'us' ) ).toBe( 'US' );
	} );
} );

describe( 'buildLocationsMapView', () => {
	it( 'sends country labels on the world map in country mode', () => {
		const view = buildLocationsMapView( { rows, geoMode: 'country' } );

		expect( view.region ).toBe( 'world' );
		expect( view.resolution ).toBe( 'countries' );
		expect( view.usesProvinceMap ).toBe( false );
		expect( view.data ).toEqual( [
			[ 'Country', 'Views' ],
			[ 'California', 10 ],
			[ 'Texas', 4 ],
			[ 'Ontario', 3 ],
		] );
	} );

	it( 'draws the provinces map of the drilled-into country in region mode', () => {
		const view = buildLocationsMapView( {
			rows,
			geoMode: 'region',
			selectedCountry: { code: 'US', name: 'United States' },
		} );

		expect( view.region ).toBe( 'US' );
		expect( view.resolution ).toBe( 'provinces' );
		expect( view.usesProvinceMap ).toBe( true );
		// The provinces map is the only view that lists sub-country places.
		expect( view.data[ 0 ] ).toEqual( [ 'Location', 'Views' ] );
	} );

	it( 'stays zoomed to the country when its provinces map is missing', () => {
		const view = buildLocationsMapView( {
			rows,
			geoMode: 'region',
			selectedCountry: { code: 'US', name: 'United States' },
			unsupportedProvinceMapCountries: new Set( [ 'US' ] ),
		} );

		// Zoomed, but drawn as one country: without the zoom a single shaded
		// country on a world map reads as an error rather than a filter.
		expect( view.region ).toBe( 'US' );
		expect( view.resolution ).toBe( 'countries' );
		expect( view.usesProvinceMap ).toBe( false );
		// Both US rows sum onto the one country; Canada is excluded.
		expect( view.data ).toEqual( [
			[ 'Country', 'Views' ],
			[ { v: 'US', f: 'United States' }, 14 ],
		] );
	} );

	it( 'zooms to the selected country in city mode', () => {
		const view = buildLocationsMapView( {
			rows: [
				{ label: 'Austin', countryCode: 'US', countryFull: 'United States', value: 6 },
				{ label: 'Mumbai', countryCode: 'IN', countryFull: 'India', value: 9 },
			],
			geoMode: 'city',
			selectedCountry: { code: 'IN', name: 'India' },
		} );

		expect( view.region ).toBe( 'IN' );
		expect( view.resolution ).toBe( 'countries' );
		expect( view.data ).toEqual( [
			[ 'Country', 'Views' ],
			[ { v: 'IN', f: 'India' }, 9 ],
		] );
	} );

	it( 'rolls region rows up to countries when no country is drilled into', () => {
		const view = buildLocationsMapView( { rows, geoMode: 'region' } );

		expect( view.region ).toBe( 'world' );
		expect( view.resolution ).toBe( 'countries' );
		expect( view.data ).toEqual( [
			[ 'Country', 'Views' ],
			[ { v: 'US', f: 'United States' }, 14 ],
			[ { v: 'CA', f: 'Canada' }, 3 ],
		] );
	} );

	it( 'rolls city rows up to countries', () => {
		const view = buildLocationsMapView( {
			rows: [
				{ label: 'Austin', countryCode: 'US', countryFull: 'United States', value: 6 },
				{ label: 'Dallas', countryCode: 'US', countryFull: 'United States', value: 2 },
				{ label: 'Taipei', countryCode: 'TW', countryFull: 'Taiwan', value: 5 },
			],
			geoMode: 'city',
		} );

		expect( view.data ).toEqual( [
			[ 'Country', 'Views' ],
			[ { v: 'US', f: 'United States' }, 8 ],
			[ { v: 'Taiwan', f: 'Taiwan' }, 5 ],
		] );
	} );

	it( 'returns a header-only table when there are no rows', () => {
		expect( buildLocationsMapView( { rows: [], geoMode: 'country' } ).data ).toEqual( [
			[ 'Country', 'Views' ],
		] );
	} );
} );

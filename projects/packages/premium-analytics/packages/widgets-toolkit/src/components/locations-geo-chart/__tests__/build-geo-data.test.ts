/**
 * External dependencies
 */
import { formatMetricValue } from '@jetpack-premium-analytics/formatters';
/**
 * Internal dependencies
 */
import { buildLocationsGeoChart } from '../build-geo-data';
import type { LocationsGeoRow } from '../build-geo-data';

function row( label: string, countryCode: string, countryFull: string, value: number ) {
	return { label, countryCode, countryFull, value };
}

const INDIA_REGIONS: LocationsGeoRow[] = [
	row( 'Maharashtra', 'IN', 'India', 5447 ),
	row( 'Delhi', 'IN', 'India', 520 ),
];

describe( 'buildLocationsGeoChart', () => {
	// Google matches ISO codes but not every API name ("Korea, Republic of").
	it( 'plots country rows on the world map by code, keeping the name for the tooltip', () => {
		const { data, region, resolution } = buildLocationsGeoChart( {
			rows: [ row( 'Korea, Republic of', 'KR', 'Korea, Republic of', 5967 ) ],
			mode: 'country',
		} );

		expect( region ).toBe( 'world' );
		expect( resolution ).toBe( 'countries' );
		expect( data ).toEqual( [
			[ 'Country', 'Views' ],
			[ { v: 'KR', f: 'Korea, Republic of' }, 5967 ],
		] );
	} );

	describe( 'region mode', () => {
		it( 'sums each country regions onto one map row', () => {
			const [ , ...rows ] = buildLocationsGeoChart( {
				rows: [ ...INDIA_REGIONS, row( 'Illinois', 'US', 'United States', 2 ) ],
				mode: 'region',
			} ).data;

			expect( rows ).toHaveLength( 2 );
			expect( rows ).toContainEqual( [ { v: 'IN', f: 'India' }, 5967, expect.any( String ) ] );
			expect( rows ).toContainEqual( [ { v: 'US', f: 'United States' }, 2, expect.any( String ) ] );
		} );

		it( 'lists a country regions in its tooltip', () => {
			const [ header, summaryRow ] = buildLocationsGeoChart( {
				rows: INDIA_REGIONS,
				mode: 'region',
			} ).data;

			expect( header[ 2 ] ).toMatchObject( { role: 'tooltip', p: { html: true } } );
			expect( summaryRow[ 2 ] ).toBe(
				`Maharashtra: ${ formatMetricValue( 5447 ) }<br />Delhi: ${ formatMetricValue( 520 ) }`
			);
		} );

		it( 'counts the regions it leaves out of a long tooltip', () => {
			const [ , summaryRow ] = buildLocationsGeoChart( {
				rows: Array.from( { length: 12 }, ( _, index ) =>
					row( `Region ${ index }`, 'IN', 'India', 12 - index )
				),
				mode: 'region',
			} ).data;
			const tooltip = String( summaryRow[ 2 ] );

			expect( tooltip.split( '<br />' ) ).toHaveLength( 11 );
			expect( tooltip ).toContain( '…and 2 more locations' );
		} );

		it( 'draws a focused country as its own provinces map', () => {
			const { data, region, resolution } = buildLocationsGeoChart( {
				rows: INDIA_REGIONS,
				mode: 'region',
				focusCountry: { code: 'IN', name: 'India' },
			} );

			expect( region ).toBe( 'IN' );
			expect( resolution ).toBe( 'provinces' );
			expect( data ).toEqual( [
				[ 'Location', 'Views' ],
				[ 'Maharashtra', 5447 ],
				[ 'Delhi', 520 ],
			] );
		} );

		it( 'falls back to the world map where the country has no provinces map', () => {
			const { data, region, resolution } = buildLocationsGeoChart( {
				rows: [ row( 'Taipei', 'TW', 'Taiwan', 40 ), row( 'Delhi', 'IN', 'India', 520 ) ],
				mode: 'region',
				focusCountry: { code: 'TW', name: 'Taiwan' },
				provinceMapSupported: false,
			} );

			expect( region ).toBe( 'world' );
			expect( resolution ).toBe( 'countries' );
			// Only the focused country is plotted, under the id GeoChart knows it by.
			expect( data ).toEqual( [
				[ 'Country', 'Views' ],
				[ { v: 'Taiwan', f: 'Taiwan' }, 40 ],
			] );
		} );
	} );

	describe( 'city mode', () => {
		const BERLIN = {
			...row( 'Berlin', 'DE', 'Germany', 300 ),
			coordinates: { latitude: 52.52, longitude: 13.405 },
		};

		it( 'draws each city as a marker at its coordinates, not as its shaded country', () => {
			const { data, region, displayMode } = buildLocationsGeoChart( {
				rows: [ BERLIN ],
				mode: 'city',
			} );

			expect( region ).toBe( 'world' );
			expect( displayMode ).toBe( 'markers' );
			expect( data ).toEqual( [
				[ 'Latitude', 'Longitude', 'Location', 'Views' ],
				[ 52.52, 13.405, 'Berlin', 300 ],
			] );
		} );

		it( 'leaves out a city without coordinates instead of placing it at 0, 0', () => {
			const { data } = buildLocationsGeoChart( {
				rows: [ BERLIN, row( 'Munich', 'DE', 'Germany', 100 ) ],
				mode: 'city',
			} );

			expect( data.slice( 1 ) ).toEqual( [ [ 52.52, 13.405, 'Berlin', 300 ] ] );
		} );

		// A filtered Cities report would otherwise draw its markers on the whole world.
		it( 'zooms to the focused country', () => {
			const { region } = buildLocationsGeoChart( {
				rows: [ BERLIN ],
				mode: 'city',
				focusCountry: { code: 'DE', name: 'Germany' },
			} );

			expect( region ).toBe( 'DE' );
		} );
	} );

	it( 'ignores a focused country in country mode', () => {
		const { region, resolution } = buildLocationsGeoChart( {
			rows: [ row( 'Germany', 'DE', 'Germany', 400 ) ],
			mode: 'country',
			focusCountry: { code: 'DE', name: 'Germany' },
		} );

		expect( region ).toBe( 'world' );
		expect( resolution ).toBe( 'countries' );
	} );
} );

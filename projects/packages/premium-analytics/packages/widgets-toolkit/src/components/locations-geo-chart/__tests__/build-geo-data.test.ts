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
	it( 'plots country rows on the world map by name', () => {
		const { data, region, resolution } = buildLocationsGeoChart( {
			rows: [ row( 'India', 'IN', 'India', 5967 ) ],
			mode: 'country',
		} );

		expect( region ).toBe( 'world' );
		expect( resolution ).toBe( 'countries' );
		expect( data ).toEqual( [
			[ 'Country', 'Views' ],
			[ 'India', 5967 ],
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

	// Cities cannot be plotted individually, so a filtered Cities report would
	// otherwise draw the whole world for a single shaded country.
	it( 'zooms to the focused country in city mode', () => {
		const { data, region, resolution } = buildLocationsGeoChart( {
			rows: [ row( 'Berlin', 'DE', 'Germany', 300 ), row( 'Munich', 'DE', 'Germany', 100 ) ],
			mode: 'city',
			focusCountry: { code: 'DE', name: 'Germany' },
		} );

		expect( region ).toBe( 'DE' );
		expect( resolution ).toBe( 'countries' );
		expect( data ).toEqual( [
			[ 'Country', 'Views' ],
			[ { v: 'DE', f: 'Germany' }, 400 ],
		] );
	} );

	it( 'gives the city mode no tooltip column', () => {
		const [ header, summaryRow ] = buildLocationsGeoChart( {
			rows: [ row( 'Mumbai', 'IN', 'India', 900 ) ],
			mode: 'city',
		} ).data;

		expect( header ).toHaveLength( 2 );
		expect( summaryRow ).toEqual( [ { v: 'IN', f: 'India' }, 900 ] );
	} );
} );

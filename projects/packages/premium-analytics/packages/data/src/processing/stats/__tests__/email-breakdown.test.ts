import { resetLocaleData, setLocaleData } from '@wordpress/i18n';
import { compareEmailBreakdownItems, sanitizeStatsEmailBreakdownResponse } from '..';
import {
	emailClientsFixture,
	emailCountriesFixture,
	emailLinksFixture,
	emailUserContentLinksFixture,
} from '../__fixtures__/email-breakdown';

const itemsOf = ( response: unknown ) =>
	sanitizeStatsEmailBreakdownResponse( response ).data[ 0 ].items;

describe( 'Stats email breakdown normalizer', () => {
	it( 'returns summary-only data for the scalar rate payload', () => {
		expect(
			sanitizeStatsEmailBreakdownResponse( {
				total_opens: '12',
				countries: { data: [] },
				'countries-info': { NZ: { country_full: 'New Zealand' } },
			} )
		).toEqual( {
			summary: {
				total_opens: 12,
			},
			data: [],
		} );
	} );

	it( 'normalizes country breakdowns', () => {
		const result = sanitizeStatsEmailBreakdownResponse( emailCountriesFixture, {
			period: 'day',
			date: '2026-06-16',
		} );

		expect( result.summary ).toEqual( { value: 32 } );
		expect( result.data[ 0 ].items ).toEqual( [
			expect.objectContaining( {
				label: 'United States',
				value: 18,
				countryCode: 'US',
				countryFull: 'United States',
				region: '019',
			} ),
			expect.objectContaining( {
				label: 'New Zealand',
				value: 12,
				countryCode: 'NZ',
				countryFull: 'New Zealand',
				region: '009',
			} ),
			expect.objectContaining( {
				label: 'Unknown',
				value: 2,
				countryCode: undefined,
			} ),
		] );
	} );

	it( 'normalizes clients and pins the catch-all bucket last by flag', () => {
		expect( itemsOf( emailClientsFixture ) ).toEqual( [
			expect.objectContaining( { label: 'Apple Mail', value: 200 } ),
			expect.objectContaining( { label: 'Thunderbird', value: 180 } ),
			expect.objectContaining( { label: 'Other', value: 265, isOther: true } ),
		] );
		expect( itemsOf( emailClientsFixture )[ 0 ].isOther ).toBeUndefined();
	} );

	it( 'maps internal link types, skips user_link, and buckets unknown types', () => {
		expect( itemsOf( emailLinksFixture ) ).toEqual( [
			expect.objectContaining( { label: 'Post URL', value: 7 } ),
			expect.objectContaining( { label: 'Like', value: 1 } ),
			expect.objectContaining( { label: 'Other', value: 3, isOther: true } ),
		] );
		expect( itemsOf( emailLinksFixture ).every( item => item.link === undefined ) ).toBe( true );
	} );

	it( 'keeps user-content links as linked rows', () => {
		expect( itemsOf( emailUserContentLinksFixture ) ).toEqual( [
			expect.objectContaining( {
				label: 'https://example.com/a',
				link: 'https://example.com/a',
				value: 4,
			} ),
			expect.objectContaining( {
				label: 'https://example.com/b',
				link: 'https://example.com/b',
				value: 2,
			} ),
		] );
	} );
} );

describe( 'Stats email breakdown localization', () => {
	afterEach( () => {
		// The i18n instance is a module-level singleton, so drop the locale data
		// again or the sibling suites stop seeing the untranslated labels.
		resetLocaleData( {}, 'jetpack-premium-analytics-pkg' );
	} );

	it( 'translates the catch-all label and keeps it pinned last', () => {
		setLocaleData( { Other: [ 'Sonstige' ] }, 'jetpack-premium-analytics-pkg' );

		const items = itemsOf( emailClientsFixture );

		expect( items.map( item => item.label ) ).toEqual( [
			'Apple Mail',
			'Thunderbird',
			'Sonstige',
		] );
	} );

	it( 'translates internal link type labels', () => {
		setLocaleData(
			{
				'Email link type\u0004Post URL': [ 'URL des Beitrags' ],
				'Email link type\u0004Like': [ 'Gefällt mir' ],
				'Email link type\u0004Other': [ 'Sonstige Links' ],
			},
			'jetpack-premium-analytics-pkg'
		);

		const items = itemsOf( emailLinksFixture );

		expect( items.map( item => item.label ) ).toEqual(
			expect.arrayContaining( [ 'URL des Beitrags', 'Gefällt mir', 'Sonstige Links' ] )
		);
	} );

	it( 'translates the unknown-country fallback label', () => {
		setLocaleData( { Unknown: [ 'Unbekannt' ] }, 'jetpack-premium-analytics-pkg' );

		const items = itemsOf( emailCountriesFixture );

		expect( items.map( item => item.label ) ).toContain( 'Unbekannt' );
	} );
} );

describe( 'compareEmailBreakdownItems', () => {
	it( 'pins the catch-all row last even when its label is localized', () => {
		const rows = [
			{ label: 'Sonstige', value: 500, isOther: true },
			{ label: 'Gmail', value: 8 },
			{ label: 'Apple Mail', value: 10 },
		];

		expect( [ ...rows ].sort( compareEmailBreakdownItems ).map( row => row.label ) ).toEqual( [
			'Apple Mail',
			'Gmail',
			'Sonstige',
		] );
	} );

	it( 'sorts an unflagged row labelled "Other" by value like any other row', () => {
		const rows = [
			{ label: 'Gmail', value: 8 },
			{ label: 'Other', value: 500 },
		];

		expect( [ ...rows ].sort( compareEmailBreakdownItems ).map( row => row.label ) ).toEqual( [
			'Other',
			'Gmail',
		] );
	} );
} );

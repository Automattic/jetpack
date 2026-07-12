import { sanitizeStatsEmailBreakdownResponse } from '..';
import {
	emailCountriesFixture,
	emailFieldlessClientsFixture,
	emailFieldlessCountriesFixture,
	emailFieldlessLinksFixture,
} from '../__fixtures__/email-breakdown';

describe( 'Stats email breakdown normalizer', () => {
	it( 'normalizes email breakdown matrices', () => {
		expect(
			sanitizeStatsEmailBreakdownResponse( emailCountriesFixture, {
				period: 'day',
				date: '2026-06-16',
			} ).data[ 0 ].items[ 0 ]
		).toEqual(
			expect.objectContaining( {
				label: 'New Zealand',
				value: 12,
				countryCode: 'NZ',
				countryFull: 'New Zealand',
			} )
		);
	} );

	it( 'returns summary-only data when no matrix metric is present', () => {
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

	it( 'normalizes fieldless email country breakdowns', () => {
		const result = sanitizeStatsEmailBreakdownResponse( emailFieldlessCountriesFixture );

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
			} ),
		] );
	} );

	it( 'normalizes fieldless email clients and keeps Other last', () => {
		expect(
			sanitizeStatsEmailBreakdownResponse( emailFieldlessClientsFixture ).data[ 0 ].items
		).toEqual( [
			expect.objectContaining( { label: 'Apple Mail', value: 10 } ),
			expect.objectContaining( { label: 'Gmail', value: 8 } ),
			expect.objectContaining( { label: 'Other', value: 1 } ),
		] );
	} );

	it( 'normalizes fieldless email link breakdowns', () => {
		expect(
			sanitizeStatsEmailBreakdownResponse( emailFieldlessLinksFixture ).data[ 0 ].items
		).toEqual( [
			expect.objectContaining( { label: 'Post URL', value: 7 } ),
			expect.objectContaining( {
				label: 'https://example.com/a',
				link: 'https://example.com/a',
				value: 4,
			} ),
			expect.objectContaining( { label: 'https://example.com/b', value: 2 } ),
			expect.objectContaining( { label: 'Like', value: 1 } ),
			expect.objectContaining( { label: 'Other', value: 3 } ),
		] );
	} );
} );

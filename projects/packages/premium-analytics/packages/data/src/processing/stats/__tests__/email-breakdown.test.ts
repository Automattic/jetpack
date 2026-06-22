import { sanitizeStatsEmailBreakdownResponse } from '..';
import { emailCountriesFixture } from '../__fixtures__/email-breakdown';

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
} );

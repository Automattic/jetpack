import { sanitizeStatsHighlightsResponse } from '..';
import { highlightsFixture } from '../__fixtures__/highlights';

describe( 'Stats highlights normalizer', () => {
	it( 'normalizes keyed highlights periods', () => {
		expect( sanitizeStatsHighlightsResponse( highlightsFixture ) ).toEqual( {
			past_seven_days: {
				range: {
					start: '2026-06-15',
					end: '2026-06-21',
				},
				comments: 2,
				likes: 5,
				views: 106,
				visitors: 28,
			},
			between_past_eight_and_fifteen_days: {
				range: {
					start: '2026-06-07',
					end: '2026-06-14',
				},
				comments: 0,
				likes: 1,
				views: 23,
				visitors: 17,
			},
			past_thirty_days: {
				range: {
					start: '2026-05-23',
					end: '2026-06-21',
				},
				comments: 3,
				likes: 6,
				views: 10001,
				visitors: 220,
			},
		} );
	} );

	it( 'returns an empty response for empty payloads', () => {
		expect( sanitizeStatsHighlightsResponse( null ) ).toEqual( {} );
	} );

	it( 'falls back for missing or malformed period fields', () => {
		expect(
			sanitizeStatsHighlightsResponse( {
				past_seven_days: {
					range: null,
					comments: undefined,
					likes: '',
					views: '0',
					visitors: '12',
				},
			} )
		).toEqual( {
			past_seven_days: {
				range: {
					start: '',
					end: '',
				},
				comments: 0,
				likes: 0,
				views: 0,
				visitors: 12,
			},
		} );
	} );
} );

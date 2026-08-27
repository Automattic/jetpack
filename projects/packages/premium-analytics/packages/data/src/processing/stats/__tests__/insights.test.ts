import { sanitizeStatsInsightsResponse } from '..';
import { insightsFixture } from '../__fixtures__/insights';

describe( 'Stats insights normalizer', () => {
	it( 'returns an empty object for invalid payloads', () => {
		expect( sanitizeStatsInsightsResponse( undefined ) ).toEqual( {} );
		expect( sanitizeStatsInsightsResponse( { highest_day_of_week: false } ) ).toEqual( {} );
	} );

	it( 'normalizes insights using the Calypso payload shape', () => {
		expect( sanitizeStatsInsightsResponse( insightsFixture ) ).toEqual( {
			dayOfWeek: 6,
			hourOfDay: 11,
			hourPercent: 5,
			percent: 10,
			hourlyViews: {
				'2022-11-26 04:00:00': 0,
				'2022-11-26 05:00:00': 4,
				'2022-11-26 06:00:00': 8,
			},
			years: [
				{
					year: '2022',
					total_posts: 2,
					total_words: 35,
					avg_words: 17.5,
					total_likes: 1,
					avg_likes: 0.5,
					total_comments: 0,
					avg_comments: 0,
					total_images: 2,
					avg_images: 1,
				},
			],
		} );
	} );

	it( 'passes the weekday index through Monday-based', () => {
		// 6 wraps to Sunday in every other case here, which would also pass if the
		// index were rebased; 0 pins the documented Monday-first contract.
		expect(
			sanitizeStatsInsightsResponse( { highest_day_of_week: 0, highest_hour: 0 } )
		).toMatchObject( { dayOfWeek: 0, hourOfDay: 0 } );
	} );

	it( 'omits the hour rather than reporting midnight when the payload has none', () => {
		const report = sanitizeStatsInsightsResponse( {
			highest_day_of_week: 6,
			highest_day_percent: 10,
		} );

		expect( report.dayOfWeek ).toBe( 6 );
		expect( report ).not.toHaveProperty( 'hourOfDay' );
		expect( report ).not.toHaveProperty( 'hourPercent' );
	} );
} );

import { sanitizeStatsInsightsResponse } from '..';
import { insightsFixture } from '../__fixtures__/insights';

describe( 'Stats insights normalizer', () => {
	it( 'reports no peak for invalid payloads', () => {
		expect( sanitizeStatsInsightsResponse( undefined ) ).not.toHaveProperty( 'dayOfWeek' );
		expect( sanitizeStatsInsightsResponse( { highest_day_of_week: false } ) ).not.toHaveProperty(
			'dayOfWeek'
		);
	} );

	it( 'keeps the years when the payload has no peak day', () => {
		// One report feeds two widgets: a site with posts but negligible views has
		// years and no peak, and Annual highlights must still get its totals.
		const report = sanitizeStatsInsightsResponse( {
			years: [ { year: '2026', total_posts: 12 } ],
		} );

		expect( report ).not.toHaveProperty( 'dayOfWeek' );
		expect( report.years ).toHaveLength( 1 );
		expect( report.years?.[ 0 ] ).toMatchObject( { year: '2026', total_posts: 12 } );
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

	it( 'omits a share the payload did not send rather than reporting 0%', () => {
		const report = sanitizeStatsInsightsResponse( { highest_day_of_week: 6, highest_hour: 19 } );

		expect( report ).not.toHaveProperty( 'percent' );
		expect( report ).not.toHaveProperty( 'hourPercent' );
	} );

	it( 'accepts a stringified hour and rejects one out of range', () => {
		expect(
			sanitizeStatsInsightsResponse( { highest_day_of_week: 6, highest_hour: '19' } )
		).toMatchObject( { hourOfDay: 19 } );
		expect(
			sanitizeStatsInsightsResponse( { highest_day_of_week: 6, highest_hour: 24 } )
		).not.toHaveProperty( 'hourOfDay' );
		expect( sanitizeStatsInsightsResponse( { highest_day_of_week: 7 } ) ).not.toHaveProperty(
			'dayOfWeek'
		);
		// Salvaged rather than rejected by `parseInt`, which would read as Thursday.
		expect( sanitizeStatsInsightsResponse( { highest_day_of_week: 3.9 } ) ).not.toHaveProperty(
			'dayOfWeek'
		);
	} );

	it( 'rejects a share it cannot read instead of reporting 0%', () => {
		for ( const highest_day_percent of [ '', false, 'abc', [], {} ] ) {
			expect(
				sanitizeStatsInsightsResponse( { highest_day_of_week: 6, highest_day_percent } )
			).not.toHaveProperty( 'percent' );
		}
	} );

	it( 'rounds a fractional share to a whole percent', () => {
		expect(
			sanitizeStatsInsightsResponse( { highest_day_of_week: 6, highest_day_percent: 17.4 } )
		).toMatchObject( { percent: 17 } );
	} );
} );

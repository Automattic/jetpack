import { sanitizeStatsInsightsResponse } from '..';
import { insightsFixture } from '../__fixtures__/insights';

describe( 'Stats insights normalizer', () => {
	it( 'returns an empty object for invalid payloads', () => {
		expect( sanitizeStatsInsightsResponse( undefined ) ).toEqual( {} );
		expect( sanitizeStatsInsightsResponse( { highest_day_of_week: false } ) ).toEqual( {} );
	} );

	it( 'normalizes insights using the Calypso payload shape', () => {
		expect( sanitizeStatsInsightsResponse( insightsFixture ) ).toEqual( {
			day: 'Sunday',
			hour: '11:00 AM',
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
} );

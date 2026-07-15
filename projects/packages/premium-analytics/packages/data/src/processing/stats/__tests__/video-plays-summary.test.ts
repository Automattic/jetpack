import { sanitizeStatsVideoPlaysSummaryResponse } from '..';
import { videoPlaysCompleteStatsSummaryFixture } from '../__fixtures__/video-plays';

describe( 'Stats video plays summary sanitizer', () => {
	it( 'parses and numerically coerces complete-stats summary rows', () => {
		expect(
			sanitizeStatsVideoPlaysSummaryResponse( videoPlaysCompleteStatsSummaryFixture )
		).toEqual( {
			data: [
				{
					id: 454,
					title: 'Product tour',
					views: 106,
					impressions: 183,
					watch_time: 0.0597,
					retention_rate: 67.6,
					link: null,
				},
			],
			total: {
				impressions: 584,
				views: 337,
				watch_time: 0.186,
			},
		} );
	} );

	it( 'returns empty rows when the summary data array is empty', () => {
		const result = sanitizeStatsVideoPlaysSummaryResponse( {
			days: { summary: { data: [], total: {} } },
		} );

		expect( result.data ).toEqual( [] );
	} );
} );

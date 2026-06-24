import { sanitizeStatsTopPostsResponse } from '../../processing/stats';
import { topPostsSummaryFixture } from '../../processing/stats/__fixtures__/top-posts';
import { withStatsTopPostsPrimaryMetric } from '../use-stats-top-posts';

describe( 'useStatsTopPosts adapters', () => {
	it( 'returns the normalized report unchanged when no primary metric is requested', () => {
		const report = sanitizeStatsTopPostsResponse( topPostsSummaryFixture, {
			period: 'day',
			start_date: '2026-06-16',
			end_date: '2026-06-22',
			summarize: true,
		} );

		expect( withStatsTopPostsPrimaryMetric( report, undefined ) ).toBe( report );
	} );

	it( 'adds opt-in primary value fields without replacing semantic top-posts fields', () => {
		const report = sanitizeStatsTopPostsResponse( topPostsSummaryFixture, {
			period: 'day',
			start_date: '2026-06-16',
			end_date: '2026-06-22',
			summarize: true,
		} );

		const result = withStatsTopPostsPrimaryMetric( report, {
			primaryMetric: 'views',
			primaryMetricLabel: 'Views',
		} );
		const item = result?.data[ 0 ].items[ 0 ];

		expect( item ).toEqual(
			expect.objectContaining( {
				label: 'Homepage',
				views: 4157,
				value: 4157,
				valueKey: 'views',
				valueLabel: 'Views',
				link: 'https://example.com/home-2/',
				href: 'https://example.com/home-2/',
			} )
		);
		expect( report.data[ 0 ].items[ 0 ] ).not.toHaveProperty( 'value' );
	} );
} );

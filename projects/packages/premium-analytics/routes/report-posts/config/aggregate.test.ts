import { postsToTimeSeries } from './aggregate';
import type { StatsNormalizedReport, StatsTopPostsItem } from '@jetpack-premium-analytics/data';

describe( 'report posts aggregate', () => {
	it( 'preserves query bucket dates when building the chart time series', () => {
		const report: StatsNormalizedReport< StatsTopPostsItem > = {
			summary: {},
			data: [
				{
					time_interval: '2026-W23',
					date_start: '2026-06-01T00:00:00+00:00',
					date_end: '2026-06-07T23:59:59+00:00',
					items: [
						{
							id: 1,
							label: 'Post A',
							views: 10,
							link: 'https://example.com/post-a/',
							type: 'post',
						},
						{
							label: 'Home page / Archives',
							views: 5,
							link: 'https://example.com/',
							type: 'homepage',
						},
					],
				},
				{
					time_interval: '2026-W24',
					date_start: '2026-06-08T00:00:00+00:00',
					date_end: '2026-06-14T23:59:59+00:00',
					items: [
						{
							id: 1,
							label: 'Post A',
							views: 12,
							link: 'https://example.com/post-a/',
							type: 'post',
						},
					],
				},
			],
		};

		const series = postsToTimeSeries( report );

		expect( series.summary ).toEqual( {
			date_start: '2026-06-01T00:00:00+00:00',
			date_end: '2026-06-14T23:59:59+00:00',
		} );
		expect( series.data.map( point => point.time_interval ) ).toEqual( [ '2026-W23', '2026-W24' ] );
		expect( series.data.map( point => point.views ) ).toEqual( [ 10, 12 ] );
	} );
} );

import { aggregateReferrerRows, flattenReferrerRows, referrersToTimeSeries } from './aggregate';
import type { StatsNormalizedReport, StatsReferrersItem } from '@jetpack-premium-analytics/data';

const searchEngines: StatsReferrersItem = {
	label: 'Search Engines',
	views: 12,
	link: null,
	icon: null,
	labelIcon: null,
	children: [
		{
			label: 'Google Search',
			views: 12,
			link: null,
			icon: null,
			labelIcon: null,
			children: [
				{
					label: 'google.com',
					views: 12,
					link: 'https://www.google.com/',
					icon: null,
					labelIcon: 'external',
					children: null,
				},
			],
		},
	],
};

describe( 'report referrers aggregate', () => {
	it( 'flattens hierarchy leaves and preserves the full parent path as the group', () => {
		expect( flattenReferrerRows( [ searchEngines ] ) ).toEqual( [
			{
				id: '["Search Engines / Google Search","google.com","https://www.google.com/"]',
				label: 'google.com',
				group: 'Search Engines / Google Search',
				views: 12,
				link: 'https://www.google.com/',
			},
		] );
	} );

	it( 'keeps ungrouped leaf referrers as top-level rows', () => {
		const direct: StatsReferrersItem = {
			label: 'jetpack.com',
			views: 4,
			link: 'https://jetpack.com/',
			icon: null,
			labelIcon: 'external',
			children: null,
		};

		expect( flattenReferrerRows( [ direct ] ) ).toEqual( [
			{
				id: '["","jetpack.com","https://jetpack.com/"]',
				label: 'jetpack.com',
				group: '',
				views: 4,
				link: 'https://jetpack.com/',
			},
		] );
	} );

	it( 'uses top-level totals for chart buckets and aggregates table leaves across buckets', () => {
		const report: StatsNormalizedReport< StatsReferrersItem > = {
			summary: {},
			data: [
				{
					time_interval: '2026-06-01',
					date_start: '2026-06-01T00:00:00+00:00',
					date_end: '2026-06-01T23:59:59+00:00',
					items: [ searchEngines ],
				},
				{
					time_interval: '2026-06-02',
					date_start: '2026-06-02T00:00:00+00:00',
					date_end: '2026-06-02T23:59:59+00:00',
					items: [
						{
							...searchEngines,
							views: 8,
							children: [
								{
									...searchEngines.children![ 0 ],
									views: 8,
									children: [
										{
											...searchEngines.children![ 0 ].children![ 0 ],
											views: 8,
										},
									],
								},
							],
						},
					],
				},
			],
		};

		const series = referrersToTimeSeries( report );
		expect( series.data.map( point => point.views ) ).toEqual( [ 12, 8 ] );
		expect( series.summary ).toEqual( {
			date_start: '2026-06-01T00:00:00+00:00',
			date_end: '2026-06-02T23:59:59+00:00',
		} );
		expect( aggregateReferrerRows( report ) ).toEqual( [
			expect.objectContaining( {
				label: 'google.com',
				group: 'Search Engines / Google Search',
				views: 20,
			} ),
		] );
	} );
} );

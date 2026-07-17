import { aggregateClickRows, clicksToTimeSeries } from './aggregate';
import type { StatsClicksItem, StatsNormalizedReport } from '@jetpack-premium-analytics/data';

/**
 * Build a top-level click item with the requested total.
 *
 * @param views - The item's click count.
 * @return The click item.
 */
function makeClickItem( views: number ): StatsClicksItem {
	return {
		label: 'jetpack.com',
		views,
		link: 'https://jetpack.com/',
		icon: null,
		labelIcon: 'external',
		children: null,
	};
}

const dailyReport: StatsNormalizedReport< StatsClicksItem > = {
	summary: {},
	data: [
		{
			time_interval: '2026-07-09',
			date_start: '2026-07-09T00:00:00+00:00',
			date_end: '2026-07-09T23:59:59+00:00',
			items: [ makeClickItem( 8 ) ],
		},
		{
			time_interval: '2026-07-10',
			date_start: '2026-07-10T00:00:00+00:00',
			date_end: '2026-07-10T23:59:59+00:00',
			items: [ makeClickItem( 5 ) ],
		},
	],
};

describe( 'report clicks aggregate', () => {
	it( 'builds the chart from top-level totals without double-counting children', () => {
		const report: StatsNormalizedReport< StatsClicksItem > = {
			summary: {},
			data: [
				{
					time_interval: '2026-06-01',
					date_start: '2026-06-01T00:00:00+00:00',
					date_end: '2026-06-01T23:59:59+00:00',
					items: [
						{
							label: 'wordpress.org',
							views: 12,
							link: null,
							icon: null,
							labelIcon: null,
							children: [
								{
									label: '/plugins/jetpack-search',
									views: 8,
									link: 'https://wordpress.org/plugins/jetpack-search',
									icon: null,
									labelIcon: 'external',
									children: null,
								},
							],
						},
					],
				},
			],
		};

		const series = clicksToTimeSeries( report );

		expect( series.data[ 0 ] ).toEqual( expect.objectContaining( { clicks: 12, value: 12 } ) );
		expect( series.summary ).toEqual( {
			date_start: '2026-06-01T00:00:00+00:00',
			date_end: '2026-06-01T23:59:59+00:00',
		} );
	} );

	it( 'groups daily totals into ISO calendar weeks for the chart', () => {
		const series = clicksToTimeSeries( dailyReport, 'week' );

		expect( series.summary ).toEqual( {
			date_start: '2026-07-09T00:00:00+00:00',
			date_end: '2026-07-10T23:59:59+00:00',
		} );
		expect( series.data ).toEqual( [
			expect.objectContaining( {
				time_interval: '2026-07-06',
				date_start: '2026-07-06T00:00:00+00:00',
				date_end: '2026-07-10T23:59:59+00:00',
				clicks: 13,
				value: 13,
			} ),
		] );
	} );

	it( 'groups daily totals into calendar months for the chart', () => {
		const reportWithNextMonth = {
			...dailyReport,
			data: [
				...dailyReport.data,
				{
					time_interval: '2026-08-02',
					date_start: '2026-08-02T00:00:00+00:00',
					date_end: '2026-08-02T23:59:59+00:00',
					items: [ makeClickItem( 3 ) ],
				},
			],
		};
		const series = clicksToTimeSeries( reportWithNextMonth, 'month' );

		expect( series.summary ).toEqual( {
			date_start: '2026-07-09T00:00:00+00:00',
			date_end: '2026-08-02T23:59:59+00:00',
		} );
		expect( series.data ).toEqual( [
			expect.objectContaining( {
				time_interval: '2026-07-01',
				date_start: '2026-07-01T00:00:00+00:00',
				date_end: '2026-07-10T23:59:59+00:00',
				clicks: 13,
				value: 13,
			} ),
			expect.objectContaining( {
				time_interval: '2026-08-01',
				date_start: '2026-08-01T00:00:00+00:00',
				date_end: '2026-08-02T23:59:59+00:00',
				clicks: 3,
				value: 3,
			} ),
		] );
	} );

	it( 'flattens grouped child URLs and aggregates them across buckets', () => {
		const item = ( views: number ): StatsClicksItem => ( {
			label: 'wordpress.org',
			views,
			link: null,
			icon: null,
			labelIcon: null,
			children: [
				{
					label: '/plugins/jetpack-search',
					views,
					link: 'https://wordpress.org/plugins/jetpack-search',
					icon: null,
					labelIcon: 'external',
					children: null,
				},
			],
		} );
		const report: StatsNormalizedReport< StatsClicksItem > = {
			summary: {},
			data: [
				{
					time_interval: '2026-06-01',
					date_start: '2026-06-01T00:00:00+00:00',
					date_end: '2026-06-01T23:59:59+00:00',
					items: [ item( 8 ) ],
				},
				{
					time_interval: '2026-06-02',
					date_start: '2026-06-02T00:00:00+00:00',
					date_end: '2026-06-02T23:59:59+00:00',
					items: [ item( 5 ) ],
				},
			],
		};

		expect( aggregateClickRows( report ) ).toEqual( [
			{
				id: 'wordpress.org|https://wordpress.org/plugins/jetpack-search',
				clickedUrl: 'https://wordpress.org/plugins/jetpack-search',
				href: 'https://wordpress.org/plugins/jetpack-search',
				group: 'wordpress.org',
				clicks: 13,
			},
		] );
	} );

	it( 'keeps a directly linked top-level URL as a row', () => {
		const report: StatsNormalizedReport< StatsClicksItem > = {
			summary: {},
			data: [
				{
					time_interval: '2026-06-01',
					date_start: '2026-06-01T00:00:00+00:00',
					date_end: '2026-06-01T23:59:59+00:00',
					items: [
						{
							label: 'jetpack.com',
							views: 4,
							link: 'https://jetpack.com/',
							icon: null,
							labelIcon: 'external',
							children: null,
						},
					],
				},
			],
		};

		expect( aggregateClickRows( report ) ).toEqual( [
			expect.objectContaining( {
				clickedUrl: 'https://jetpack.com/',
				group: 'jetpack.com',
				clicks: 4,
			} ),
		] );
	} );
} );

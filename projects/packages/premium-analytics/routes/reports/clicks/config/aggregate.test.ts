import { aggregateClickRows } from './aggregate';
import type {
	StatsClicksComparisonItem,
	StatsClicksItem,
	StatsNormalizedReport,
} from '@jetpack-premium-analytics/data';

describe( 'report clicks aggregate', () => {
	it( 'preserves comparison values on click groups and nested URLs', () => {
		const items: StatsClicksComparisonItem[] = [
			{
				label: 'wordpress.org',
				views: 55,
				previousValue: 40,
				link: null,
				icon: null,
				labelIcon: null,
				children: [
					{
						label: '/plugins/jetpack-search',
						views: 42,
						previousValue: 28,
						link: 'https://wordpress.org/plugins/jetpack-search',
						icon: null,
						labelIcon: 'external',
						children: null,
					},
				],
			},
		];

		expect( aggregateClickRows( { data: [ { items } ] } ) ).toEqual( [
			expect.objectContaining( {
				id: 'wordpress.org',
				clickedUrl: 'wordpress.org',
				clicks: 55,
				previousClicks: 40,
			} ),
			expect.objectContaining( {
				id: 'wordpress.org|https://wordpress.org/plugins/jetpack-search',
				parentId: 'wordpress.org',
				clickedUrl: 'https://wordpress.org/plugins/jetpack-search',
				clicks: 42,
				previousClicks: 28,
			} ),
		] );
	} );

	it( 'nests grouped child URLs under a parent row and aggregates them across buckets', () => {
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
				id: 'wordpress.org',
				clickedUrl: 'wordpress.org',
				isGroup: true,
				clicks: 13,
			},
			{
				id: 'wordpress.org|https://wordpress.org/plugins/jetpack-search',
				parentId: 'wordpress.org',
				clickedUrl: 'https://wordpress.org/plugins/jetpack-search',
				href: 'https://wordpress.org/plugins/jetpack-search',
				clicks: 13,
			},
		] );
	} );

	it( 'folds a single-URL group into the nested group that lists the same URL', () => {
		const report: StatsNormalizedReport< StatsClicksItem > = {
			summary: {},
			data: [
				{
					time_interval: '2026-06-01',
					date_start: '2026-06-01T00:00:00+00:00',
					date_end: '2026-06-01T23:59:59+00:00',
					items: [
						{
							label: 'github.com',
							views: 5,
							link: null,
							icon: null,
							labelIcon: null,
							children: [
								{
									label: 'github.com/Automattic/jetpack',
									views: 3,
									link: 'https://github.com/Automattic/jetpack',
									icon: null,
									labelIcon: 'external',
									children: null,
								},
								{
									label: 'github.com/Automattic/themes',
									views: 2,
									link: 'https://github.com/Automattic/themes',
									icon: null,
									labelIcon: 'external',
									children: null,
								},
							],
						},
					],
				},
				{
					time_interval: '2026-06-02',
					date_start: '2026-06-02T00:00:00+00:00',
					date_end: '2026-06-02T23:59:59+00:00',
					items: [
						// The only github.com URL clicked this day, so Stats
						// reports it as its own top-level group.
						{
							label: 'github.com/Automattic/themes',
							views: 5,
							link: 'https://github.com/Automattic/themes',
							icon: null,
							labelIcon: 'external',
							children: null,
						},
					],
				},
			],
		};

		expect( aggregateClickRows( report ) ).toEqual( [
			{ id: 'github.com', clickedUrl: 'github.com', isGroup: true, clicks: 10 },
			{
				id: 'github.com|https://github.com/Automattic/themes',
				parentId: 'github.com',
				clickedUrl: 'https://github.com/Automattic/themes',
				href: 'https://github.com/Automattic/themes',
				clicks: 7,
			},
			{
				id: 'github.com|https://github.com/Automattic/jetpack',
				parentId: 'github.com',
				clickedUrl: 'https://github.com/Automattic/jetpack',
				href: 'https://github.com/Automattic/jetpack',
				clicks: 3,
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
				href: 'https://jetpack.com/',
				clicks: 4,
			} ),
		] );
		// A single-URL group stays one flat row — no drill-down parent.
		expect( aggregateClickRows( report ) ).toHaveLength( 1 );
	} );

	it( 'returns no rows when the report is missing or carries no data', () => {
		expect( aggregateClickRows() ).toEqual( [] );
		expect( aggregateClickRows( undefined ) ).toEqual( [] );
	} );

	it( 'keeps an unlinked leaf, which the Clicks widget also lists', () => {
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
							views: 9,
							link: null,
							icon: null,
							labelIcon: null,
							children: [
								{
									label: '/plugins/jetpack-search',
									views: 6,
									link: 'https://wordpress.org/plugins/jetpack-search',
									icon: null,
									labelIcon: 'external',
									children: null,
								},
								{
									label: 'untracked',
									views: 3,
									link: null,
									icon: null,
									labelIcon: null,
									children: null,
								},
							],
						},
					],
				},
			],
		};

		const rows = aggregateClickRows( report );

		expect( rows.map( row => row.clickedUrl ) ).toEqual( [
			'wordpress.org',
			'https://wordpress.org/plugins/jetpack-search',
			'untracked',
		] );
		// The label carries the row, so the cell renders as plain text.
		expect( rows[ 2 ] ).toMatchObject( {
			id: 'wordpress.org|label:untracked',
			parentId: 'wordpress.org',
			clicks: 3,
			href: undefined,
		} );
	} );

	it( 'drops a leaf with no label and no URL, which has no stable id', () => {
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
							views: 9,
							link: null,
							icon: null,
							labelIcon: null,
							children: [
								{
									label: '/plugins/jetpack-search',
									views: 6,
									link: 'https://wordpress.org/plugins/jetpack-search',
									icon: null,
									labelIcon: 'external',
									children: null,
								},
								{
									label: '',
									views: 3,
									link: null,
									icon: null,
									labelIcon: null,
									children: null,
								},
							],
						},
					],
				},
			],
		};

		const rows = aggregateClickRows( report );

		expect( rows.map( row => row.clickedUrl ) ).toEqual( [
			'wordpress.org',
			'https://wordpress.org/plugins/jetpack-search',
		] );
	} );
} );

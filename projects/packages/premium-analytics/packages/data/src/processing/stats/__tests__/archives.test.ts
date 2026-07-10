import { sanitizeStatsArchivesResponse } from '..';
import { archivesFixture, archivesSummaryFixture } from '../__fixtures__/archives';

describe( 'Stats archives normalizer', () => {
	it( 'hoists the child link when collapsing a home archive group', () => {
		const bucketed = sanitizeStatsArchivesResponse( archivesFixture, {
			period: 'day',
			end_date: '2026-06-16',
		} );
		const summarized = sanitizeStatsArchivesResponse( archivesSummaryFixture, {
			period: 'day',
			start_date: '2025-06-01',
			date: '2025-06-02',
			summarize: 1,
		} );

		expect( bucketed.data[ 0 ].items.find( item => item.label === 'home' ) ).toEqual(
			expect.objectContaining( {
				children: null,
				link: 'https://example.com/',
			} )
		);
		expect( summarized.data[ 0 ].items.find( item => item.label === 'home' ) ).toEqual(
			expect.objectContaining( {
				children: null,
				link: 'http://jetpack.com/',
			} )
		);
	} );

	it( 'normalizes archives into sorted grouped rows', () => {
		const result = sanitizeStatsArchivesResponse( archivesFixture, {
			period: 'day',
			end_date: '2026-06-16',
		} );

		expect( result.summary ).toEqual( expect.objectContaining( { total: 15 } ) );
		expect( result.data[ 0 ].items ).toEqual( [
			expect.objectContaining( {
				label: 'tax',
				value: 8,
			} ),
			expect.objectContaining( {
				label: 'post_type',
				value: 4,
			} ),
			expect.objectContaining( {
				label: 'home',
				value: 3,
				children: null,
			} ),
		] );
	} );

	it( 'keeps non-summarized bucket dates scoped to each bucket', () => {
		const result = sanitizeStatsArchivesResponse(
			{
				days: {
					'2026-06-01': archivesFixture.days[ '2026-06-16' ],
					'2026-06-08': {
						home: [
							{
								value: 'home',
								href: 'https://example.com/',
								views: '5',
							},
						],
					},
				},
			},
			{
				period: 'week',
				start_date: '2026-06-01',
				end_date: '2026-07-04',
			}
		);

		expect(
			result.data.map( ( { time_interval, date_start, date_end } ) => ( {
				time_interval,
				date_start,
				date_end,
			} ) )
		).toEqual( [
			{
				time_interval: '2026-06-01',
				date_start: '2026-06-01T00:00:00+00:00',
				date_end: '2026-06-07T23:59:59+00:00',
			},
			{
				time_interval: '2026-06-08',
				date_start: '2026-06-08T00:00:00+00:00',
				date_end: '2026-06-14T23:59:59+00:00',
			},
		] );
	} );

	it( 'keeps days without archive views as zero-value buckets', () => {
		const result = sanitizeStatsArchivesResponse(
			{
				days: {
					'2026-07-05': [],
					'2026-07-04': [],
					'2026-07-03': {
						home: [ { value: 'home', href: 'https://example.com/', views: '2' } ],
					},
					'2026-07-02': {
						home: [ { value: 'home', href: 'https://example.com/', views: '1' } ],
					},
				},
				period: 'day',
			},
			{
				period: 'day',
				start_date: '2026-07-02',
				date: '2026-07-05',
			}
		);

		expect( result.data.map( point => point.time_interval ) ).toEqual( [
			'2026-07-05',
			'2026-07-04',
			'2026-07-03',
			'2026-07-02',
		] );
		expect( result.data.map( point => point.items.length ) ).toEqual( [ 0, 0, 1, 1 ] );
		expect( result.summary ).toEqual( { total: 3 } );
	} );

	it( 'normalizes summarized archives from the backend summary payload', () => {
		const result = sanitizeStatsArchivesResponse( archivesSummaryFixture, {
			period: 'day',
			start_date: '2025-06-01',
			date: '2025-06-02',
			summarize: 1,
		} );

		expect( result.summary ).toEqual( {
			total: 160,
		} );
		expect( result.data ).toEqual( [
			expect.objectContaining( {
				time_interval: '2025-06-02',
				date_start: '2025-06-01T00:00:00+00:00',
				date_end: '2025-06-02T23:59:59+00:00',
				items: [
					{
						label: 'home',
						value: 89,
						link: 'http://jetpack.com/',
						children: null,
					},
					{
						label: 'cat',
						value: 51,
						children: [
							{
								label: 'rrr',
								value: 51,
								link: 'http://jetpack.com/category/rrr/',
								children: null,
							},
						],
					},
					{
						label: 'tax',
						value: 10,
						children: [
							{
								label: 'topics',
								value: 10,
								children: [
									{
										label: 'aaa',
										value: 6,
										link: 'http://jetpack.com/?taxonomy=topics&term=aaa',
										children: null,
									},
									{
										label: 'bbb',
										value: 4,
										link: 'http://jetpack.com/?taxonomy=topics&term=bbb',
										children: null,
									},
								],
							},
						],
					},
					{
						label: 'date',
						value: 7,
						children: [
							{
								label: '2024/05',
								value: 4,
								link: 'http://jetpack.com/2024/05',
								children: null,
							},
							{
								label: '2023/06',
								value: 3,
								link: 'http://jetpack.com/2023/06',
								children: null,
							},
						],
					},
					{
						label: 'search',
						value: 3,
						children: [
							{
								label: 'I can',
								value: 2,
								link: 'http://jetpack.com/?s=I+can',
								children: null,
							},
							{
								label: 'plugin',
								value: 1,
								link: 'http://jetpack.com/?s=plugin',
								children: null,
							},
						],
					},
				],
			} ),
		] );
	} );
} );

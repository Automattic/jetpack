import { sanitizeStatsTopAuthorsResponse } from '..';
import { topAuthorsFixture, topAuthorsSummaryFixture } from '../__fixtures__/top-authors';

describe( 'Stats top authors normalizer', () => {
	it( 'normalizes summarized top authors into range data', () => {
		const result = sanitizeStatsTopAuthorsResponse( topAuthorsSummaryFixture, {
			period: 'day',
			start_date: '2026-06-16',
			end_date: '2026-06-22',
			summarize: true,
		} );

		expect( result.summary ).toEqual( {
			date_start: '2026-06-16T00:00:00+00:00',
			date_end: '2026-06-22T23:59:59+00:00',
		} );
		expect( result.data[ 0 ].items[ 0 ] ).toEqual(
			expect.objectContaining( {
				id: 196411292,
				label: 'Jetpack Team',
				views: 4166,
				icon: 'https://example.com/avatar.png',
				children: [
					expect.objectContaining( {
						id: 265143,
						label: 'Homepage',
						views: 4157,
						link: 'https://example.com/?p=265143',
						actions: [ { type: 'link', data: 'https://example.com/?p=265143' } ],
					} ),
					expect.objectContaining( {
						id: 345724,
						label: 'What’s new in Jetpack: June 2025 Update',
						views: 3,
						link: 'https://example.com/?p=345724',
					} ),
				],
			} )
		);
	} );

	it( 'normalizes top authors into by-date data points', () => {
		const result = sanitizeStatsTopAuthorsResponse( topAuthorsFixture, {
			end_date: '2026-06-16',
		} );

		expect( result.summary ).toEqual( {} );
		expect( result.data[ 0 ] ).toEqual(
			expect.objectContaining( {
				time_interval: '2026-06-16',
				date_start: '2026-06-16T00:00:00+00:00',
				date_end: '2026-06-16T23:59:59+00:00',
				items: [
					expect.objectContaining( {
						id: 196411292,
						label: 'Jetpack Team',
						views: 64,
						children: [
							expect.objectContaining( {
								id: 265143,
								label: 'Homepage',
								views: 60,
							} ),
						],
					} ),
				],
			} )
		);
	} );

	it( 'does not add link actions when author posts have no URL', () => {
		const result = sanitizeStatsTopAuthorsResponse(
			{
				date: '2026-06-22',
				period: 'day',
				summary: {
					authors: [
						{
							name: 'Jetpack Team',
							views: 3,
							posts: [ { id: 123, title: 'Homepage', views: 3 } ],
						},
					],
				},
			},
			{
				period: 'day',
				start_date: '2026-06-16',
				end_date: '2026-06-22',
				summarize: true,
			}
		);

		expect( result.data[ 0 ].items[ 0 ].children ).toEqual( [
			expect.objectContaining( {
				label: 'Homepage',
				link: null,
				actions: [],
			} ),
		] );
	} );
} );

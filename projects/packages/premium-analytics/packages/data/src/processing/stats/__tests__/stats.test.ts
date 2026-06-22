/**
 * Internal dependencies
 */
import {
	sanitizeStatsFileDownloadsResponse,
	sanitizeStatsLocationsResponse,
	sanitizeStatsReferrersResponse,
	sanitizeStatsTopPostsResponse,
	sanitizeStatsVideoPlaysResponse,
} from '..';
import {
	fileDownloadsFixture,
	locationsFixture,
	referrersFixture,
	topPostsFixture,
	videoPlaysFixture,
} from '../__fixtures__/stats';

describe( 'Stats normalizers', () => {
	it( 'normalizes top posts into report data', () => {
		expect(
			sanitizeStatsTopPostsResponse( topPostsFixture, { period: 'day', date: '2026-06-16' } ).data
		).toEqual( [
			expect.objectContaining( {
				id: 41,
				label: 'Hello world',
				views: 64,
				children: null,
				meta: expect.objectContaining( {
					link: 'https://example.com/hello/',
				} ),
			} ),
		] );
	} );

	it( 'normalizes nested referrers', () => {
		const result = sanitizeStatsReferrersResponse( referrersFixture, {
			period: 'day',
			date: '2026-06-16',
		} );

		expect( result.data[ 0 ] ).toEqual(
			expect.objectContaining( {
				label: 'example.com/path',
				views: 12,
				meta: expect.objectContaining( {
					actionMenu: 1,
				} ),
			} )
		);
	} );

	it( 'normalizes file downloads with numeric values', () => {
		expect(
			sanitizeStatsFileDownloadsResponse( fileDownloadsFixture, {
				period: 'day',
				date: '2026-06-16',
			} ).data[ 0 ]
		).toEqual(
			expect.objectContaining( {
				label: '/download.pdf',
				downloads: 5,
				meta: expect.objectContaining( {
					shortLabel: 'download.pdf',
				} ),
			} )
		);
	} );

	it( 'normalizes location labels with multiple apostrophes', () => {
		const result = sanitizeStatsLocationsResponse( locationsFixture, {
			period: 'day',
			date: '2026-06-16',
		} );

		expect( result.data[ 0 ] ).toEqual(
			expect.objectContaining( {
				label: "Côte d'Ivoire's",
				views: 7,
			} )
		);
		expect( result.summary ).toEqual( expect.objectContaining( { total: 7 } ) );
	} );

	it( 'normalizes secondary video metrics as semantic fields', () => {
		expect(
			sanitizeStatsVideoPlaysResponse( videoPlaysFixture, {
				period: 'day',
				date: '2026-06-16',
			} ).data[ 0 ]
		).toEqual(
			expect.objectContaining( {
				id: 12,
				label: 'Launch video',
				plays: 11,
				impressions: 42,
				watch_time: 128.5,
				retention_rate: 61.25,
				meta: expect.objectContaining( {
					link: 'https://example.com/video/',
				} ),
			} )
		);
	} );
} );

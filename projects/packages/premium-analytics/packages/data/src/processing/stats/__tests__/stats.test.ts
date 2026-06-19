/**
 * Internal dependencies
 */
import {
	sanitizeStatsFileDownloadsResponse,
	sanitizeStatsLocationsResponse,
	sanitizeStatsReferrersResponse,
	sanitizeStatsTopPostsResponse,
} from '..';
import {
	fileDownloadsFixture,
	locationsFixture,
	referrersFixture,
	topPostsFixture,
} from '../__fixtures__/stats';

describe( 'Stats normalizers', () => {
	it( 'normalizes top posts into report data', () => {
		expect(
			sanitizeStatsTopPostsResponse( topPostsFixture, { period: 'day', date: '2026-06-16' } ).data
		).toEqual( [
			expect.objectContaining( {
				id: 41,
				label: 'Hello world',
				value: 64,
				link: 'https://example.com/hello/',
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
				value: 12,
				actionMenu: 1,
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
				shortLabel: 'download.pdf',
				value: 5,
			} )
		);
	} );

	it( 'normalizes location labels with multiple apostrophes', () => {
		expect(
			sanitizeStatsLocationsResponse( locationsFixture, {
				period: 'day',
				date: '2026-06-16',
			} ).data[ 0 ]
		).toEqual(
			expect.objectContaining( {
				label: "Côte d'Ivoire's",
				value: 7,
			} )
		);
	} );
} );

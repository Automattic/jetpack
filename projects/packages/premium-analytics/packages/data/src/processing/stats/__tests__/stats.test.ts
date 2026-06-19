/**
 * Internal dependencies
 */
import {
	sanitizeStatsDevicesResponse,
	sanitizeStatsFileDownloadsResponse,
	sanitizeStatsGenericListResponse,
	sanitizeStatsReferrersResponse,
	sanitizeStatsTopPostsResponse,
	sanitizeStatsUtmResponse,
} from '..';
import {
	devicesFixture,
	fileDownloadsFixture,
	genericListFixture,
	referrersFixture,
	topPostsFixture,
	utmFixture,
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

	it( 'flattens UTM children with parent context', () => {
		expect( sanitizeStatsUtmResponse( utmFixture ).data ).toEqual( [
			expect.objectContaining( { label: 'google', value: 10 } ),
			expect.objectContaining( { label: 'google > cpc', value: 6 } ),
		] );
	} );

	it( 'keeps parsed device values when the raw payload value is a string', () => {
		expect( sanitizeStatsDevicesResponse( devicesFixture ).data[ 0 ] ).toEqual(
			expect.objectContaining( {
				label: 'Desktop',
				value: 42,
			} )
		);
	} );

	it( 'keeps parsed generic list values when the raw payload has a value field', () => {
		expect(
			sanitizeStatsGenericListResponse( genericListFixture, 'views', 'name' ).data[ 0 ]
		).toEqual(
			expect.objectContaining( {
				label: 'Example tag',
				value: 18,
			} )
		);
	} );
} );

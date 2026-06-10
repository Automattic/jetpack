/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
/**
 * Internal dependencies
 */
import { fetchReportTopPosts } from '../report-top-posts-fetch';

jest.mock( '@wordpress/api-fetch', () => jest.fn() );

const mockApiFetch = apiFetch as unknown as jest.Mock;

describe( 'fetchReportTopPosts', () => {
	beforeEach( () => {
		mockApiFetch.mockReset();
		mockApiFetch.mockResolvedValue( { date: '2026-06-10', days: {} } );
		window.jpaConfig = {
			siteId: 123,
			apiRoot: 'https://example.com/wp-json/',
			nonce: 'abc',
		};
	} );

	afterEach( () => {
		delete window.jpaConfig;
	} );

	it( 'composes the stats proxy URL from the boot config site ID', async () => {
		await fetchReportTopPosts( { period: 'day', date: '2026-06-10', num: 10 } );

		expect( mockApiFetch ).toHaveBeenCalledWith( {
			path: '/jetpack/v4/stats-app/sites/123/stats/top-posts?period=day&date=2026-06-10&max=10',
		} );
	} );

	it( 'omits max when num is not provided', async () => {
		await fetchReportTopPosts( { period: 'week', date: '2026-06-10' } );

		expect( mockApiFetch ).toHaveBeenCalledWith( {
			path: '/jetpack/v4/stats-app/sites/123/stats/top-posts?period=week&date=2026-06-10',
		} );
	} );

	it( 'throws a clear error when the boot config is missing', async () => {
		delete window.jpaConfig;

		await expect( fetchReportTopPosts( { period: 'day', date: '2026-06-10' } ) ).rejects.toThrow(
			'window.jpaConfig is not available'
		);
	} );
} );

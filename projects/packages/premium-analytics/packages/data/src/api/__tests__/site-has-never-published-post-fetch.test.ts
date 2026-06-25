/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
/**
 * Internal dependencies
 */
import { fetchSiteHasNeverPublishedPost } from '../site-has-never-published-post-fetch';

jest.mock( '@wordpress/api-fetch' );

const mockApiFetch = apiFetch as jest.MockedFunction< typeof apiFetch >;

afterEach( () => {
	jest.clearAllMocks();
} );

describe( 'fetchSiteHasNeverPublishedPost', () => {
	it( 'requests the local site state endpoint', async () => {
		mockApiFetch.mockResolvedValue( true );

		await expect( fetchSiteHasNeverPublishedPost() ).resolves.toBe( true );

		expect( mockApiFetch ).toHaveBeenCalledWith( {
			path: '/jetpack-premium-analytics/v1/site/has-never-published-post',
		} );
	} );
} );

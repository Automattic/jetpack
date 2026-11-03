/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
/**
 * Internal dependencies
 */
import { submitStatsUserFeedback } from '../stats-user-feedback';

jest.mock( '@wordpress/api-fetch' );

const mockApiFetch = apiFetch as jest.MockedFunction< typeof apiFetch >;

describe( 'submitStatsUserFeedback', () => {
	beforeEach( () => {
		mockApiFetch.mockReset();
		mockApiFetch.mockResolvedValue( 'success' );
	} );

	it( 'sends the rating along with the comment', async () => {
		await submitStatsUserFeedback( { rating: 4, comment: 'Faster than before', productName: 'X' } );

		expect( mockApiFetch ).toHaveBeenCalledWith( {
			path: '/jetpack-premium-analytics/v1/proxy/v2/jetpack-stats/user-feedback',
			method: 'POST',
			data: {
				source_url: window.location.href,
				product_name: 'X',
				feedback: 'Faster than before',
				rating: 4,
			},
			parse: false,
		} );
	} );

	it( 'leaves the rating out when the reader picked none', async () => {
		await submitStatsUserFeedback( { comment: 'Missing the map', productName: 'X' } );

		const { data } = mockApiFetch.mock.calls[ 0 ][ 0 ] as {
			data: Record< string, unknown >;
		};
		expect( data ).not.toHaveProperty( 'rating' );
		expect( data.feedback ).toBe( 'Missing the map' );
	} );
} );

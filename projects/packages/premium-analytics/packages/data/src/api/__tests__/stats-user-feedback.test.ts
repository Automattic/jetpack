/**
 * Internal dependencies
 */
import { fetchStatsProxy } from '../stats-proxy-fetch';
import { submitStatsUserFeedback } from '../stats-user-feedback';

jest.mock( '../stats-proxy-fetch', () => ( {
	fetchStatsProxy: jest.fn().mockResolvedValue( 'success' ),
} ) );

const mockFetchStatsProxy = fetchStatsProxy as jest.MockedFunction< typeof fetchStatsProxy >;

describe( 'submitStatsUserFeedback', () => {
	afterEach( () => {
		jest.clearAllMocks();
	} );

	it( 'sends the rating along with the comment', async () => {
		await submitStatsUserFeedback( { rating: 4, comment: 'Faster than before', productName: 'X' } );

		expect( mockFetchStatsProxy ).toHaveBeenCalledWith(
			expect.objectContaining( {
				endpoint: 'jetpack-stats/user-feedback',
				body: expect.objectContaining( { rating: 4, feedback: 'Faster than before' } ),
			} )
		);
	} );

	it( 'leaves the rating out when the reader picked none', async () => {
		await submitStatsUserFeedback( { comment: 'Missing the map', productName: 'X' } );

		const { body } = mockFetchStatsProxy.mock.calls[ 0 ][ 0 ] as {
			body: Record< string, unknown >;
		};
		expect( body ).not.toHaveProperty( 'rating' );
		expect( body.feedback ).toBe( 'Missing the map' );
	} );
} );

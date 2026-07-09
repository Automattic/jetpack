import apiFetch from '@wordpress/api-fetch';
import executionLock from '../../../shared/execution-lock';
import { setPostEmailSentState, setTotalEmailsSentCount } from '../actions';
import { getPostEmailSentState, getTotalEmailsSentCount } from '../resolvers';
import * as utils from '../utils';

jest.mock( '@wordpress/api-fetch' );
jest.mock( '@automattic/jetpack-script-data', () => ( {
	isSimpleSite: jest.fn( () => true ),
} ) );

describe( 'Membership Products Resolvers', () => {
	const mockDispatch = jest.fn();
	const mockRegistry = {};

	beforeEach( () => {
		jest.clearAllMocks();
		executionLock.clearAll();
		jest.spyOn( utils, 'onError' ).mockImplementation( () => {} );
	} );

	describe( 'getPostEmailSentState', () => {
		test( 'success: fetches and dispatches setPostEmailSentState', async () => {
			const postId = 5;
			const apiResponse = {
				email_sent_at: 'Jan 15, 2024',
				stats_on_send: { access_level: 'subscribers', paid_tier: null },
			};
			apiFetch.mockResolvedValue( apiResponse );

			const thunk = getPostEmailSentState( postId );
			await thunk( { dispatch: mockDispatch, registry: mockRegistry } );

			expect( apiFetch ).toHaveBeenCalledWith( {
				path: expect.stringContaining( '/wpcom/v2/newsletter-email-sent-status' ),
				method: 'GET',
			} );
			expect( apiFetch.mock.calls[ 0 ][ 0 ].path ).toContain( `post_id=${ postId }` );
			expect( mockDispatch ).toHaveBeenCalledWith(
				setPostEmailSentState( postId, {
					email_sent_at: apiResponse.email_sent_at,
					stats_on_send: apiResponse.stats_on_send,
				} )
			);
		} );

		test( 'postId falsy: returns early without calling apiFetch', async () => {
			const thunk = getPostEmailSentState( 0 );
			await thunk( { dispatch: mockDispatch, registry: mockRegistry } );

			expect( apiFetch ).not.toHaveBeenCalled();
			expect( mockDispatch ).not.toHaveBeenCalled();
		} );

		test( 'postId null: returns early without calling apiFetch', async () => {
			const thunk = getPostEmailSentState( null );
			await thunk( { dispatch: mockDispatch, registry: mockRegistry } );

			expect( apiFetch ).not.toHaveBeenCalled();
			expect( mockDispatch ).not.toHaveBeenCalled();
		} );

		test( 'WP_Error response: calls onError and does not dispatch setPostEmailSentState', async () => {
			apiFetch.mockResolvedValue( {
				errors: { rest_forbidden: [ 'Sorry, you are not allowed.' ] },
			} );

			const thunk = getPostEmailSentState( 5 );
			await thunk( { dispatch: mockDispatch, registry: mockRegistry } );

			expect( utils.onError ).toHaveBeenCalled();
			expect( mockDispatch ).not.toHaveBeenCalled();
		} );
	} );

	describe( 'getTotalEmailsSentCount', () => {
		test( 'success: fetches and dispatches setTotalEmailsSentCount', async () => {
			const blogId = 123;
			const postId = 456;
			const apiResponse = { total_sends: 50 };
			apiFetch.mockResolvedValue( apiResponse );

			const thunk = getTotalEmailsSentCount( blogId, postId );
			await thunk( { dispatch: mockDispatch, registry: mockRegistry } );

			expect( apiFetch ).toHaveBeenCalledWith( {
				path: `/rest/v1.1/sites/${ blogId }/stats/opens/emails/${ postId }/rate`,
			} );
			expect( mockDispatch ).toHaveBeenCalledWith( setTotalEmailsSentCount( 50 ) );
		} );

		test( 'blogId missing: returns early without calling apiFetch', async () => {
			const thunk = getTotalEmailsSentCount( null, 456 );
			await thunk( { dispatch: mockDispatch, registry: mockRegistry } );

			expect( apiFetch ).not.toHaveBeenCalled();
		} );

		test( 'postId missing: returns early without calling apiFetch', async () => {
			const thunk = getTotalEmailsSentCount( 123, null );
			await thunk( { dispatch: mockDispatch, registry: mockRegistry } );

			expect( apiFetch ).not.toHaveBeenCalled();
		} );

		test( 'WP_Error response: fails silently (no onError, no dispatch)', async () => {
			// Email stats are informational — errors should never flash in the
			// editor (see NL-578).
			const warnSpy = jest.spyOn( console, 'warn' ).mockImplementation( () => {} );
			apiFetch.mockResolvedValue( {
				errors: { rest_forbidden: [ 'Sorry, you are not allowed.' ] },
			} );

			const thunk = getTotalEmailsSentCount( 123, 456 );
			await thunk( { dispatch: mockDispatch, registry: mockRegistry } );

			expect( utils.onError ).not.toHaveBeenCalled();
			expect( mockDispatch ).not.toHaveBeenCalled();
			expect( warnSpy ).toHaveBeenCalled();
			warnSpy.mockRestore();
		} );

		test( 'apiFetch rejects (e.g. timeout): fails silently', async () => {
			const warnSpy = jest.spyOn( console, 'warn' ).mockImplementation( () => {} );
			apiFetch.mockRejectedValue( new Error( 'cURL error 28: Operation timed out' ) );

			const thunk = getTotalEmailsSentCount( 123, 456 );
			await thunk( { dispatch: mockDispatch, registry: mockRegistry } );

			expect( utils.onError ).not.toHaveBeenCalled();
			expect( mockDispatch ).not.toHaveBeenCalled();
			expect( warnSpy ).toHaveBeenCalledWith(
				'Failed to fetch total emails sent count:',
				'cURL error 28: Operation timed out'
			);
			warnSpy.mockRestore();
		} );
	} );
} );

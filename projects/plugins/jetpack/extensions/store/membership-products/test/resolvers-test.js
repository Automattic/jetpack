import apiFetch from '@wordpress/api-fetch';
import executionLock from '../../../shared/execution-lock';
import {
	setApiState,
	setConnectUrl,
	setPostEmailSentState,
	setTotalEmailsSentCount,
} from '../actions';
import { API_STATE_NOTCONNECTED } from '../constants';
import { getPostEmailSentState, getProducts, getTotalEmailsSentCount } from '../resolvers';

const mockCreateNotice = jest.fn();
const mockCreateErrorNotice = jest.fn();
const mockNoticesDispatch = jest.fn( () => ( {
	createNotice: mockCreateNotice,
	createErrorNotice: mockCreateErrorNotice,
} ) );

jest.mock( '@wordpress/api-fetch' );
jest.mock( '@automattic/jetpack-connection', () => ( {
	getUserConnectionUrl: jest.fn(
		() => 'https://example.com/wp-admin/admin.php?connect_url_redirect=1'
	),
} ) );
jest.mock( '@automattic/jetpack-script-data', () => ( {
	isSimpleSite: jest.fn( () => true ),
} ) );
jest.mock( '@wordpress/notices', () => ( {
	store: 'core/notices',
} ) );

describe( 'Membership Products Resolvers', () => {
	const mockDispatch = jest.fn();
	const mockRegistry = { dispatch: mockNoticesDispatch };

	beforeEach( () => {
		jest.clearAllMocks();
		executionLock.clearAll();
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

		test( 'WP_Error response: shows snackbar error and does not dispatch setPostEmailSentState', async () => {
			apiFetch.mockResolvedValue( {
				errors: { rest_forbidden: [ 'Sorry, you are not allowed.' ] },
			} );

			const thunk = getPostEmailSentState( 5 );
			await thunk( { dispatch: mockDispatch, registry: mockRegistry } );

			expect( mockCreateErrorNotice ).toHaveBeenCalledWith( 'Sorry, you are not allowed.', {
				type: 'snackbar',
			} );
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

			expect( mockCreateErrorNotice ).not.toHaveBeenCalled();
			expect( mockDispatch ).not.toHaveBeenCalled();
			expect( warnSpy ).toHaveBeenCalled();
			warnSpy.mockRestore();
		} );

		test( 'apiFetch rejects (e.g. timeout): fails silently', async () => {
			const warnSpy = jest.spyOn( console, 'warn' ).mockImplementation( () => {} );
			apiFetch.mockRejectedValue( new Error( 'cURL error 28: Operation timed out' ) );

			const thunk = getTotalEmailsSentCount( 123, 456 );
			await thunk( { dispatch: mockDispatch, registry: mockRegistry } );

			expect( mockCreateErrorNotice ).not.toHaveBeenCalled();
			expect( mockDispatch ).not.toHaveBeenCalled();
			expect( warnSpy ).toHaveBeenCalledWith(
				'Failed to fetch total emails sent count:',
				'cURL error 28: Operation timed out'
			);
			warnSpy.mockRestore();
		} );
	} );

	describe( 'getProducts', () => {
		const { isSimpleSite } = require( '@automattic/jetpack-script-data' );
		const mockSelect = { getProductsNoResolver: jest.fn( () => [] ) };

		beforeEach( () => {
			isSimpleSite.mockReturnValue( false );
		} );

		test( 'rest_unauthorized on non-simple site: shows warning notice with connect URL', async () => {
			const unauthorizedError = Object.assign(
				new Error( 'Please connect your user account to WordPress.com' ),
				{
					code: 'rest_unauthorized',
				}
			);
			apiFetch.mockRejectedValue( unauthorizedError );

			const thunk = getProducts();
			await thunk( { dispatch: mockDispatch, registry: mockRegistry, select: mockSelect } );

			expect( mockDispatch ).toHaveBeenCalledWith( setConnectUrl( null ) );
			expect( mockDispatch ).toHaveBeenCalledWith( setApiState( API_STATE_NOTCONNECTED ) );
			expect( mockCreateErrorNotice ).not.toHaveBeenCalled();
			expect( mockNoticesDispatch ).toHaveBeenCalledWith( 'core/notices' );
			expect( mockCreateNotice ).toHaveBeenCalledWith(
				'warning',
				expect.stringContaining( 'connect your WordPress.com account' ),
				expect.objectContaining( {
					id: 'jetpack-memberships-user-connection-required',
					actions: expect.arrayContaining( [
						expect.objectContaining( {
							label: expect.any( String ),
							url: expect.stringContaining( 'connect_url_redirect' ),
						} ),
					] ),
				} )
			);
		} );

		test( 'rest_unauthorized on simple site: falls through to generic snackbar error', async () => {
			isSimpleSite.mockReturnValue( true );
			const unauthorizedError = Object.assign(
				new Error( 'Please connect your user account to WordPress.com' ),
				{
					code: 'rest_unauthorized',
				}
			);
			apiFetch.mockRejectedValue( unauthorizedError );

			const thunk = getProducts();
			await thunk( { dispatch: mockDispatch, registry: mockRegistry, select: mockSelect } );

			expect( mockCreateErrorNotice ).toHaveBeenCalledWith(
				'Please connect your user account to WordPress.com',
				{ type: 'snackbar' }
			);
			expect( mockCreateNotice ).not.toHaveBeenCalled();
		} );

		test( 'other error: shows snackbar error with the error message', async () => {
			apiFetch.mockRejectedValue( new Error( 'Something went wrong' ) );

			const thunk = getProducts();
			await thunk( { dispatch: mockDispatch, registry: mockRegistry, select: mockSelect } );

			expect( mockCreateErrorNotice ).toHaveBeenCalledWith( 'Something went wrong', {
				type: 'snackbar',
			} );
			expect( mockCreateNotice ).not.toHaveBeenCalled();
		} );
	} );
} );

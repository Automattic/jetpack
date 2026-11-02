import { isCurrentUserConnected } from '@automattic/jetpack-shared-extension-utils';
import apiFetch from '@wordpress/api-fetch';
import executionLock from '../../../shared/execution-lock';
import {
	setApiState,
	setConnectUrl,
	setNewsletterCategories,
	setPostEmailSentState,
	setProducts,
	setTotalEmailsSentCount,
} from '../actions';
import { API_STATE_NOTCONNECTED } from '../constants';
import {
	getNewsletterCategories,
	getPostEmailSentState,
	getProducts,
	getTotalEmailsSentCount,
} from '../resolvers';
import * as utils from '../utils';

jest.mock( '@wordpress/api-fetch' );
jest.mock( '@automattic/jetpack-script-data', () => ( {
	isSimpleSite: jest.fn( () => true ),
} ) );
jest.mock( '@automattic/jetpack-shared-extension-utils', () => ( {
	...jest.requireActual( '@automattic/jetpack-shared-extension-utils' ),
	isCurrentUserConnected: jest.fn( () => true ),
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

	describe( 'getProducts', () => {
		test( 'connected user: fetches membership status and stores the products', async () => {
			const products = [ { id: 1, title: 'Monthly' } ];
			apiFetch.mockResolvedValue( {
				products,
				connected_account_id: 123,
				connect_url: null,
				site_slug: 'example.com',
				connected_account_default_currency: 'USD',
			} );
			const registry = { select: () => ( { getCurrentPostId: () => 5 } ) };
			const select = { getProductsNoResolver: () => products };

			const thunk = getProducts();
			await thunk( { dispatch: mockDispatch, registry, select } );

			expect( apiFetch.mock.calls[ 0 ][ 0 ].path ).toContain( '/wpcom/v2/memberships/status' );
			expect( mockDispatch ).toHaveBeenCalledWith( setProducts( products ) );
			expect( utils.onError ).not.toHaveBeenCalled();
		} );
	} );

	describe( 'getNewsletterCategories', () => {
		test( 'connected user: fetches and stores the categories', async () => {
			const categories = [ { id: 7, name: 'News' } ];
			apiFetch.mockResolvedValue( { enabled: true, newsletter_categories: categories } );

			const thunk = getNewsletterCategories();
			await thunk( { dispatch: mockDispatch, registry: mockRegistry } );

			expect( apiFetch ).toHaveBeenCalledWith( { path: '/wpcom/v2/newsletter-categories' } );
			expect( mockDispatch ).toHaveBeenCalledWith(
				setNewsletterCategories( { enabled: true, categories } )
			);
		} );
	} );

	describe( 'current user not connected to WordPress.com', () => {
		beforeEach( () => {
			isCurrentUserConnected.mockReturnValue( false );
		} );

		afterEach( () => {
			isCurrentUserConnected.mockReturnValue( true );
		} );

		test( 'getPostEmailSentState skips the request and shows no error', async () => {
			const thunk = getPostEmailSentState( 5 );
			await thunk( { dispatch: mockDispatch, registry: mockRegistry } );

			expect( apiFetch ).not.toHaveBeenCalled();
			expect( utils.onError ).not.toHaveBeenCalled();
			expect( mockDispatch ).not.toHaveBeenCalled();
		} );

		test( 'getProducts skips the request and marks the API as not connected', async () => {
			const thunk = getProducts();
			await thunk( { dispatch: mockDispatch, registry: mockRegistry, select: {} } );

			expect( apiFetch ).not.toHaveBeenCalled();
			expect( utils.onError ).not.toHaveBeenCalled();
			expect( mockDispatch ).toHaveBeenCalledWith( setConnectUrl( null ) );
			expect( mockDispatch ).toHaveBeenCalledWith( setApiState( API_STATE_NOTCONNECTED ) );
		} );

		test( 'getNewsletterCategories skips the request and marks the API as not connected', async () => {
			const thunk = getNewsletterCategories();
			await thunk( { dispatch: mockDispatch, registry: mockRegistry } );

			expect( apiFetch ).not.toHaveBeenCalled();
			expect( utils.onError ).not.toHaveBeenCalled();
			expect( mockDispatch ).toHaveBeenCalledWith( setApiState( API_STATE_NOTCONNECTED ) );
		} );
	} );
} );

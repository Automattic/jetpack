/**
 * External dependencies
 */
import { describe, expect, it, jest, beforeEach } from '@jest/globals';

// Mocks must be registered before importing the module under test.
const updateMenuCounter = jest.fn();
const updateMenuCounterOptimistically = jest.fn();
const apiFetch = jest.fn();

await jest.unstable_mockModule( '../../../../src/dashboard/inbox/utils.js', () => ( {
	updateMenuCounter,
	updateMenuCounterOptimistically,
	withTimeout: promise => promise,
} ) );

await jest.unstable_mockModule( '@wordpress/api-fetch', () => ( {
	default: apiFetch,
} ) );

/**
 * Internal dependencies
 */
const { markResponseAsRead } = await import( '../../../../src/dashboard/inbox/mark-as-read.ts' );

describe( 'markResponseAsRead', () => {
	let editEntityRecord;

	beforeEach( () => {
		jest.clearAllMocks();
		editEntityRecord = jest.fn();
	} );

	it( 'marks a published response read and syncs the sidebar counter', async () => {
		apiFetch.mockResolvedValue( { count: 4 } );
		const onSuccess = jest.fn();

		await markResponseAsRead( { id: 7, status: 'publish' }, editEntityRecord, onSuccess );

		expect( editEntityRecord ).toHaveBeenCalledWith( 'postType', 'feedback', 7, {
			is_unread: false,
		} );
		// Optimistic decrement happens before the server responds.
		expect( updateMenuCounterOptimistically ).toHaveBeenCalledWith( -1 );
		expect( apiFetch ).toHaveBeenCalledWith(
			expect.objectContaining( {
				path: '/wp/v2/feedback/7/read',
				method: 'POST',
				data: { is_unread: false },
			} )
		);
		// The authoritative server count is applied on success.
		expect( updateMenuCounter ).toHaveBeenCalledWith( 4 );
		expect( onSuccess ).toHaveBeenCalledWith( 7 );
	} );

	it( 'does not optimistically decrement the counter for non-published responses', async () => {
		apiFetch.mockResolvedValue( { count: 4 } );

		await markResponseAsRead( { id: 8, status: 'spam' }, editEntityRecord );

		expect( updateMenuCounterOptimistically ).not.toHaveBeenCalled();
		// The server count is still applied so the badge stays authoritative.
		expect( updateMenuCounter ).toHaveBeenCalledWith( 4 );
	} );

	it( 'reverts the store edit and the optimistic counter when the request fails', async () => {
		apiFetch.mockRejectedValue( new Error( 'network' ) );

		await markResponseAsRead( { id: 9, status: 'publish' }, editEntityRecord );

		expect( editEntityRecord ).toHaveBeenNthCalledWith( 1, 'postType', 'feedback', 9, {
			is_unread: false,
		} );
		expect( editEntityRecord ).toHaveBeenNthCalledWith( 2, 'postType', 'feedback', 9, {
			is_unread: true,
		} );
		expect( updateMenuCounterOptimistically ).toHaveBeenNthCalledWith( 1, -1 );
		expect( updateMenuCounterOptimistically ).toHaveBeenNthCalledWith( 2, 1 );
		expect( updateMenuCounter ).not.toHaveBeenCalled();
	} );

	it( 'does not revert the optimistic counter for non-published responses on failure', async () => {
		apiFetch.mockRejectedValue( new Error( 'network' ) );

		await markResponseAsRead( { id: 10, status: 'trash' }, editEntityRecord );

		expect( editEntityRecord ).toHaveBeenNthCalledWith( 2, 'postType', 'feedback', 10, {
			is_unread: true,
		} );
		expect( updateMenuCounterOptimistically ).not.toHaveBeenCalled();
	} );
} );

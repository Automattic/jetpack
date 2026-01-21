/**
 * External dependencies
 */
import { describe, expect, it, jest, beforeEach } from '@jest/globals';

// Create mock function
const updateMenuCounterOptimistically = jest.fn();

// Mock the utils module before importing
await jest.unstable_mockModule( '../../../../src/dashboard/inbox/utils.js', () => ( {
	updateMenuCounterOptimistically,
	updateMenuCounter: jest.fn(),
	withTimeout: promise => promise,
} ) );

/**
 * Internal dependencies
 */
const { processStatusChange } = await import(
	'../../../../src/dashboard/inbox/stage/process-status-change.ts'
);

describe( 'processStatusChange menu counter', () => {
	let editEntityRecord;
	let updateCountsOptimistically;

	beforeEach( () => {
		jest.clearAllMocks();
		editEntityRecord = jest.fn();
		updateCountsOptimistically = jest.fn();
	} );

	it( 'decrements counter when moving unread publish item to spam', async () => {
		const items = [ { id: 1, status: 'publish', is_unread: true } ];
		const apiCall = jest.fn().mockResolvedValue( { id: 1 } );

		await processStatusChange( {
			items,
			newStatus: 'spam',
			apiCall,
			editEntityRecord,
			updateCountsOptimistically,
			queryParams: {},
		} );

		expect( updateMenuCounterOptimistically ).toHaveBeenCalledWith( -1 );
	} );

	it( 'decrements counter when moving unread publish item to trash', async () => {
		const items = [ { id: 1, status: 'publish', is_unread: true } ];
		const apiCall = jest.fn().mockResolvedValue( { id: 1 } );

		await processStatusChange( {
			items,
			newStatus: 'trash',
			apiCall,
			editEntityRecord,
			updateCountsOptimistically,
			queryParams: {},
		} );

		expect( updateMenuCounterOptimistically ).toHaveBeenCalledWith( -1 );
	} );

	it( 'increments counter when restoring unread spam item to publish', async () => {
		const items = [ { id: 1, status: 'spam', is_unread: true } ];
		const apiCall = jest.fn().mockResolvedValue( { id: 1 } );

		await processStatusChange( {
			items,
			newStatus: 'publish',
			apiCall,
			editEntityRecord,
			updateCountsOptimistically,
			queryParams: {},
		} );

		expect( updateMenuCounterOptimistically ).toHaveBeenCalledWith( 1 );
	} );

	it( 'increments counter when restoring unread trash item to publish', async () => {
		const items = [ { id: 1, status: 'trash', is_unread: true } ];
		const apiCall = jest.fn().mockResolvedValue( { id: 1 } );

		await processStatusChange( {
			items,
			newStatus: 'publish',
			apiCall,
			editEntityRecord,
			updateCountsOptimistically,
			queryParams: {},
		} );

		expect( updateMenuCounterOptimistically ).toHaveBeenCalledWith( 1 );
	} );

	it( 'does not update counter for read items', async () => {
		const items = [ { id: 1, status: 'publish', is_unread: false } ];
		const apiCall = jest.fn().mockResolvedValue( { id: 1 } );

		await processStatusChange( {
			items,
			newStatus: 'spam',
			apiCall,
			editEntityRecord,
			updateCountsOptimistically,
			queryParams: {},
		} );

		expect( updateMenuCounterOptimistically ).not.toHaveBeenCalled();
	} );

	it( 'does not update counter when moving spam to trash', async () => {
		const items = [ { id: 1, status: 'spam', is_unread: true } ];
		const apiCall = jest.fn().mockResolvedValue( { id: 1 } );

		await processStatusChange( {
			items,
			newStatus: 'trash',
			apiCall,
			editEntityRecord,
			updateCountsOptimistically,
			queryParams: {},
		} );

		expect( updateMenuCounterOptimistically ).not.toHaveBeenCalled();
	} );

	it( 'updates counter once per item in bulk operations', async () => {
		const items = [
			{ id: 1, status: 'publish', is_unread: true },
			{ id: 2, status: 'publish', is_unread: true },
			{ id: 3, status: 'publish', is_unread: true },
		];
		const apiCall = jest
			.fn()
			.mockResolvedValueOnce( { id: 1 } )
			.mockResolvedValueOnce( { id: 2 } )
			.mockResolvedValueOnce( { id: 3 } );

		await processStatusChange( {
			items,
			newStatus: 'spam',
			apiCall,
			editEntityRecord,
			updateCountsOptimistically,
			queryParams: {},
		} );

		expect( updateMenuCounterOptimistically ).toHaveBeenCalledTimes( 3 );
		expect( updateMenuCounterOptimistically ).toHaveBeenCalledWith( -1 );
	} );

	it( 'reverts counter when API call fails', async () => {
		const items = [ { id: 1, status: 'publish', is_unread: true } ];
		const apiCall = jest.fn().mockRejectedValue( new Error( 'API Error' ) );

		await processStatusChange( {
			items,
			newStatus: 'spam',
			apiCall,
			editEntityRecord,
			updateCountsOptimistically,
			queryParams: {},
		} );

		// Should be called twice: once to decrement, once to revert
		expect( updateMenuCounterOptimistically ).toHaveBeenCalledTimes( 2 );
		expect( updateMenuCounterOptimistically ).toHaveBeenNthCalledWith( 1, -1 ); // Initial optimistic update
		expect( updateMenuCounterOptimistically ).toHaveBeenNthCalledWith( 2, 1 ); // Revert
	} );

	it( 'reverts counter when restoring from spam fails', async () => {
		const items = [ { id: 1, status: 'spam', is_unread: true } ];
		const apiCall = jest.fn().mockRejectedValue( new Error( 'API Error' ) );

		await processStatusChange( {
			items,
			newStatus: 'publish',
			apiCall,
			editEntityRecord,
			updateCountsOptimistically,
			queryParams: {},
		} );

		// Should be called twice: once to increment, once to revert
		expect( updateMenuCounterOptimistically ).toHaveBeenCalledTimes( 2 );
		expect( updateMenuCounterOptimistically ).toHaveBeenNthCalledWith( 1, 1 ); // Initial optimistic update
		expect( updateMenuCounterOptimistically ).toHaveBeenNthCalledWith( 2, -1 ); // Revert
	} );

	it( 'reverts only failed items in bulk operations', async () => {
		const items = [
			{ id: 1, status: 'publish', is_unread: true },
			{ id: 2, status: 'publish', is_unread: true },
			{ id: 3, status: 'publish', is_unread: true },
		];
		const apiCall = jest
			.fn()
			.mockResolvedValueOnce( { id: 1 } ) // Success
			.mockRejectedValueOnce( new Error( 'API Error' ) ) // Fail
			.mockResolvedValueOnce( { id: 3 } ); // Success

		await processStatusChange( {
			items,
			newStatus: 'spam',
			apiCall,
			editEntityRecord,
			updateCountsOptimistically,
			queryParams: {},
		} );

		// Called 3 times for optimistic updates, 1 time to revert the failed item
		expect( updateMenuCounterOptimistically ).toHaveBeenCalledTimes( 4 );
		expect( updateMenuCounterOptimistically ).toHaveBeenNthCalledWith( 1, -1 );
		expect( updateMenuCounterOptimistically ).toHaveBeenNthCalledWith( 2, -1 );
		expect( updateMenuCounterOptimistically ).toHaveBeenNthCalledWith( 3, -1 );
		expect( updateMenuCounterOptimistically ).toHaveBeenNthCalledWith( 4, 1 ); // Revert for item 2
	} );

	it( 'does not revert counter for read items when API fails', async () => {
		const items = [ { id: 1, status: 'publish', is_unread: false } ];
		const apiCall = jest.fn().mockRejectedValue( new Error( 'API Error' ) );

		await processStatusChange( {
			items,
			newStatus: 'spam',
			apiCall,
			editEntityRecord,
			updateCountsOptimistically,
			queryParams: {},
		} );

		// Should not be called at all since item is read
		expect( updateMenuCounterOptimistically ).not.toHaveBeenCalled();
	} );
} );

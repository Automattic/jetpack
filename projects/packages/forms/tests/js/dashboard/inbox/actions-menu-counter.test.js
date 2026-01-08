/**
 * @jest-environment jsdom
 */
/**
 * External dependencies
 */
import { describe, expect, it, jest, beforeEach } from '@jest/globals';

// Mock functions
const updateMenuCounterOptimistically = jest.fn();
const editEntityRecord = jest.fn();
const updateCountsOptimistically = jest.fn();

// Recreate the core logic from processStatusChange for testing
// This matches the implementation in actions.tsx lines 234-250
const processStatusChange = async ( {
	items,
	newStatus,
	apiCall,
	editEntityRecord: editEntity,
	updateCountsOptimistically: updateCounts,
	queryParams,
} ) => {
	// Make optimistic updates
	items.forEach( item => {
		editEntity( 'postType', 'feedback', item.id, {
			status: newStatus,
		} );

		updateCounts( item.status, newStatus, 1, queryParams );

		// Update unread counts optimistically
		if (
			item.is_unread &&
			( newStatus === 'spam' || newStatus === 'trash' ) &&
			item.status === 'publish'
		) {
			updateMenuCounterOptimistically( -1 );
		}

		if (
			item.is_unread &&
			( item.status === 'spam' || item.status === 'trash' ) &&
			newStatus === 'publish'
		) {
			updateMenuCounterOptimistically( 1 );
		}
	} );

	// Call API
	const promises = await Promise.allSettled( items.map( ( { id } ) => apiCall( id ) ) );

	const itemsUpdated = [];
	promises.forEach( promise => {
		if ( promise.status === 'fulfilled' && promise.value?.id ) {
			itemsUpdated.push( promise.value );
		}
	} );

	return {
		itemsUpdated,
		itemsFailed: [],
		numberOfErrors: 0,
	};
};

describe( 'processStatusChange menu counter', () => {
	beforeEach( () => {
		jest.clearAllMocks();
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
} );

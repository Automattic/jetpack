/**
 * External dependencies
 */
import { describe, expect, it, jest, beforeEach, afterEach } from '@jest/globals';

/**
 * Internal dependencies
 */
const { processStatusChange } = await import(
	'../../../../src/dashboard/inbox/stage/process-status-change.ts'
);

const FORMS_MENU_BADGE_SLUG = 'jetpack-forms-responses-wp-admin';

/**
 * A `setCount` stand-in that mirrors the real shared client: it writes the new
 * count back onto the badge's `data-jp-menu-count` attribute, so sequential
 * optimistic updates (e.g. across a bulk operation) compound correctly.
 */
const setCount = jest.fn( ( menuSlug, count ) => {
	const badge = document.querySelector( `[data-jp-menu-badge="${ menuSlug }"]` );
	if ( badge ) {
		badge.setAttribute( 'data-jp-menu-count', String( count ) );
	}
} );

describe( 'processStatusChange menu counter', () => {
	let editEntityRecord;
	let updateCountsOptimistically;

	beforeEach( () => {
		jest.clearAllMocks();
		editEntityRecord = jest.fn();
		updateCountsOptimistically = jest.fn();
		document.body.innerHTML = `<span data-jp-menu-badge="${ FORMS_MENU_BADGE_SLUG }" data-jp-menu-count="5"></span>`;
		window.jetpackMenuBadges = { setCount };
	} );

	afterEach( () => {
		delete window.jetpackMenuBadges;
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

		expect( setCount ).toHaveBeenCalledWith( FORMS_MENU_BADGE_SLUG, 4 );
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

		expect( setCount ).toHaveBeenCalledWith( FORMS_MENU_BADGE_SLUG, 4 );
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

		expect( setCount ).toHaveBeenCalledWith( FORMS_MENU_BADGE_SLUG, 6 );
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

		expect( setCount ).toHaveBeenCalledWith( FORMS_MENU_BADGE_SLUG, 6 );
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

		expect( setCount ).not.toHaveBeenCalled();
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

		expect( setCount ).not.toHaveBeenCalled();
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

		// Each item decrements the shared badge count in turn: 5 -> 4 -> 3 -> 2.
		expect( setCount ).toHaveBeenCalledTimes( 3 );
		expect( setCount ).toHaveBeenNthCalledWith( 1, FORMS_MENU_BADGE_SLUG, 4 );
		expect( setCount ).toHaveBeenNthCalledWith( 2, FORMS_MENU_BADGE_SLUG, 3 );
		expect( setCount ).toHaveBeenNthCalledWith( 3, FORMS_MENU_BADGE_SLUG, 2 );
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

		// Should be called twice: once to decrement (5 -> 4), once to revert (4 -> 5).
		expect( setCount ).toHaveBeenCalledTimes( 2 );
		expect( setCount ).toHaveBeenNthCalledWith( 1, FORMS_MENU_BADGE_SLUG, 4 ); // Initial optimistic update
		expect( setCount ).toHaveBeenNthCalledWith( 2, FORMS_MENU_BADGE_SLUG, 5 ); // Revert
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

		// Should be called twice: once to increment (5 -> 6), once to revert (6 -> 5).
		expect( setCount ).toHaveBeenCalledTimes( 2 );
		expect( setCount ).toHaveBeenNthCalledWith( 1, FORMS_MENU_BADGE_SLUG, 6 ); // Initial optimistic update
		expect( setCount ).toHaveBeenNthCalledWith( 2, FORMS_MENU_BADGE_SLUG, 5 ); // Revert
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

		// 3 optimistic decrements (5 -> 4 -> 3 -> 2), then 1 revert for the failed item (2 -> 3).
		expect( setCount ).toHaveBeenCalledTimes( 4 );
		expect( setCount ).toHaveBeenNthCalledWith( 1, FORMS_MENU_BADGE_SLUG, 4 );
		expect( setCount ).toHaveBeenNthCalledWith( 2, FORMS_MENU_BADGE_SLUG, 3 );
		expect( setCount ).toHaveBeenNthCalledWith( 3, FORMS_MENU_BADGE_SLUG, 2 );
		expect( setCount ).toHaveBeenNthCalledWith( 4, FORMS_MENU_BADGE_SLUG, 3 ); // Revert for item 2
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
		expect( setCount ).not.toHaveBeenCalled();
	} );
} );

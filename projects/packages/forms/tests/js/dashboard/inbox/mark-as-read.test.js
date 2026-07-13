/**
 * External dependencies
 */
import { describe, expect, it, jest, beforeEach, afterEach } from '@jest/globals';

// Mocks must be registered before importing the module under test.
const apiFetch = jest.fn();

await jest.unstable_mockModule( '@wordpress/api-fetch', () => ( {
	default: apiFetch,
} ) );

/**
 * Internal dependencies
 */
const { markResponseAsRead } = await import( '../../../../src/dashboard/inbox/mark-as-read.ts' );

const FORMS_MENU_BADGE_SLUG = 'jetpack-forms-responses-wp-admin';

/**
 * A `setCount` stand-in that mirrors the real shared client: it writes the new
 * count back onto the badge's `data-jp-menu-count` attribute, so a later
 * `getMenuBadgeCount()` read (e.g. to compute a revert) sees the latest value.
 */
const setCount = jest.fn( ( menuSlug, count ) => {
	const badge = document.querySelector( `[data-jp-menu-badge="${ menuSlug }"]` );
	if ( badge ) {
		badge.setAttribute( 'data-jp-menu-count', String( count ) );
	}
} );

describe( 'markResponseAsRead', () => {
	let editEntityRecord;

	beforeEach( () => {
		jest.clearAllMocks();
		editEntityRecord = jest.fn();
		document.body.innerHTML = '';
		window.jetpackMenuBadges = { setCount };
	} );

	afterEach( () => {
		delete window.jetpackMenuBadges;
	} );

	it( 'marks a published response read and syncs the sidebar counter', async () => {
		document.body.innerHTML = `<span data-jp-menu-badge="${ FORMS_MENU_BADGE_SLUG }" data-jp-menu-count="5"></span>`;
		apiFetch.mockResolvedValue( { count: 4 } );
		const onSuccess = jest.fn();

		await markResponseAsRead( { id: 7, status: 'publish' }, editEntityRecord, onSuccess );

		expect( editEntityRecord ).toHaveBeenCalledWith( 'postType', 'feedback', 7, {
			is_unread: false,
		} );
		// Optimistic decrement happens before the server responds, based on the DOM count (5 - 1 = 4).
		expect( setCount ).toHaveBeenNthCalledWith( 1, FORMS_MENU_BADGE_SLUG, 4 );
		expect( apiFetch ).toHaveBeenCalledWith(
			expect.objectContaining( {
				path: '/wp/v2/feedback/7/read',
				method: 'POST',
				data: { is_unread: false },
			} )
		);
		// The authoritative server count is applied on success.
		expect( setCount ).toHaveBeenNthCalledWith( 2, FORMS_MENU_BADGE_SLUG, 4 );
		expect( onSuccess ).toHaveBeenCalledWith( 7 );
	} );

	it( 'does not optimistically decrement the counter for non-published responses', async () => {
		apiFetch.mockResolvedValue( { count: 4 } );

		await markResponseAsRead( { id: 8, status: 'spam' }, editEntityRecord );

		// The server count is still applied so the badge stays authoritative.
		expect( setCount ).toHaveBeenCalledTimes( 1 );
		expect( setCount ).toHaveBeenCalledWith( FORMS_MENU_BADGE_SLUG, 4 );
	} );

	it( 'reverts the store edit and the optimistic counter when the request fails', async () => {
		document.body.innerHTML = `<span data-jp-menu-badge="${ FORMS_MENU_BADGE_SLUG }" data-jp-menu-count="5"></span>`;
		apiFetch.mockRejectedValue( new Error( 'network' ) );

		await markResponseAsRead( { id: 9, status: 'publish' }, editEntityRecord );

		expect( editEntityRecord ).toHaveBeenNthCalledWith( 1, 'postType', 'feedback', 9, {
			is_unread: false,
		} );
		expect( editEntityRecord ).toHaveBeenNthCalledWith( 2, 'postType', 'feedback', 9, {
			is_unread: true,
		} );
		// Optimistic decrement (5 - 1 = 4), then reverted back to 5 on failure.
		expect( setCount ).toHaveBeenNthCalledWith( 1, FORMS_MENU_BADGE_SLUG, 4 );
		expect( setCount ).toHaveBeenNthCalledWith( 2, FORMS_MENU_BADGE_SLUG, 5 );
	} );

	it( 'does not revert the optimistic counter for non-published responses on failure', async () => {
		apiFetch.mockRejectedValue( new Error( 'network' ) );

		await markResponseAsRead( { id: 10, status: 'trash' }, editEntityRecord );

		expect( editEntityRecord ).toHaveBeenNthCalledWith( 2, 'postType', 'feedback', 10, {
			is_unread: true,
		} );
		expect( setCount ).not.toHaveBeenCalled();
	} );
} );

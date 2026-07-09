/**
 * External dependencies
 */
import { describe, expect, it, jest, beforeEach, afterEach } from '@jest/globals';
/**
 * Internal dependencies
 */
import { optimisticallyUpdateUnreadCount } from '../../../../src/dashboard/inbox/stage/process-status-change';

const FORMS_MENU_BADGE_SLUG = 'jetpack-forms-responses-wp-admin';

/**
 * A `setCount` stand-in that mirrors the real shared client: it writes the new
 * count back onto the badge's `data-jp-menu-count` attribute.
 */
const setCount = jest.fn( ( menuSlug, count ) => {
	const badge = document.querySelector( `[data-jp-menu-badge="${ menuSlug }"]` );
	if ( badge ) {
		badge.setAttribute( 'data-jp-menu-count', String( count ) );
	}
} );

describe( 'optimisticallyUpdateUnreadCount', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		document.body.innerHTML = `<span data-jp-menu-badge="${ FORMS_MENU_BADGE_SLUG }" data-jp-menu-count="5"></span>`;
		window.jetpackMenuBadges = { setCount };
	} );

	afterEach( () => {
		delete window.jetpackMenuBadges;
	} );

	it( 'does not change counter for read items', () => {
		optimisticallyUpdateUnreadCount( 'spam', 'publish', false );

		expect( setCount ).not.toHaveBeenCalled();
	} );

	it( 'decrements counter when moving unread item from publish to spam', () => {
		optimisticallyUpdateUnreadCount( 'spam', 'publish', true );

		expect( setCount ).toHaveBeenCalledWith( FORMS_MENU_BADGE_SLUG, 4 );
	} );

	it( 'decrements counter when moving unread item from publish to trash', () => {
		optimisticallyUpdateUnreadCount( 'trash', 'publish', true );

		expect( setCount ).toHaveBeenCalledWith( FORMS_MENU_BADGE_SLUG, 4 );
	} );

	it( 'increments counter when restoring unread item to publish', () => {
		optimisticallyUpdateUnreadCount( 'publish', 'spam', true );

		expect( setCount ).toHaveBeenCalledWith( FORMS_MENU_BADGE_SLUG, 6 );
	} );

	it( 'does not change counter when moving between spam and trash', () => {
		optimisticallyUpdateUnreadCount( 'trash', 'spam', true );

		expect( setCount ).not.toHaveBeenCalled();
	} );
} );

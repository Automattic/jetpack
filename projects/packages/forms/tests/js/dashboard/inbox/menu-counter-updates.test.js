/**
 * External dependencies
 */
import { describe, expect, it, beforeEach } from '@jest/globals';
/**
 * Internal dependencies
 */
import { FORMS_MENU_BADGE_SLUG, getMenuBadgeCount } from '../../../../src/dashboard/inbox/utils';

describe( 'getMenuBadgeCount', () => {
	beforeEach( () => {
		document.body.innerHTML = '';
	} );

	it( 'reads the count from the Forms badge data attribute', () => {
		document.body.innerHTML = `<span data-jp-menu-badge="${ FORMS_MENU_BADGE_SLUG }" data-jp-menu-count="5"></span>`;

		expect( getMenuBadgeCount() ).toBe( 5 );
	} );

	it( 'returns 0 when the badge is not rendered (e.g. count is already 0)', () => {
		expect( getMenuBadgeCount() ).toBe( 0 );
	} );

	it( 'ignores badges for other menu slugs', () => {
		document.body.innerHTML =
			'<span data-jp-menu-badge="some-other-plugin" data-jp-menu-count="9"></span>';

		expect( getMenuBadgeCount() ).toBe( 0 );
	} );

	it( 'returns 0 for a non-numeric count attribute', () => {
		document.body.innerHTML = `<span data-jp-menu-badge="${ FORMS_MENU_BADGE_SLUG }" data-jp-menu-count="not-a-number"></span>`;

		expect( getMenuBadgeCount() ).toBe( 0 );
	} );
} );

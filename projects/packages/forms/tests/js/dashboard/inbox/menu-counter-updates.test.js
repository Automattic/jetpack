/**
 * External dependencies
 */
import { describe, expect, it, beforeEach } from '@jest/globals';
/**
 * Internal dependencies
 */
import { getFormsMenuBadgeSlug, getMenuBadgeCount } from '../../../../src/dashboard/inbox/utils';

const FORMS_MENU_BADGE_SLUG = 'jetpack-forms-responses-wp-admin';

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

describe( 'getFormsMenuBadgeSlug', () => {
	beforeEach( () => {
		document.body.innerHTML = '';
	} );

	it( 'returns the wp-build slug when that badge is rendered', () => {
		document.body.innerHTML = `<span data-jp-menu-badge="${ FORMS_MENU_BADGE_SLUG }" data-jp-menu-count="5"></span>`;

		expect( getFormsMenuBadgeSlug() ).toBe( FORMS_MENU_BADGE_SLUG );
	} );

	it( 'falls back to the wp-build slug when no badge is rendered', () => {
		expect( getFormsMenuBadgeSlug() ).toBe( FORMS_MENU_BADGE_SLUG );
	} );
} );

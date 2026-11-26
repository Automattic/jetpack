// eslint-disable-next-line import/no-unresolved -- Core's script module, mocked below.
import { speak } from '@wordpress/a11y';
import { announcePage, menuLabel } from '../../../src/admin-shell/chrome';

jest.mock( '@wordpress/a11y', () => ( { speak: jest.fn() } ), { virtual: true } );

describe( 'announcePage', () => {
	it( 'speaks each page title politely', async () => {
		announcePage( 'Jetpack Forms ‹ Site — WordPress' );
		announcePage( 'My Jetpack ‹ Site — WordPress' );

		await new Promise( resolve => setTimeout( resolve ) );
		expect( speak.mock.calls ).toEqual( [
			[ 'Jetpack Forms ‹ Site — WordPress', 'polite' ],
			[ 'My Jetpack ‹ Site — WordPress', 'polite' ],
		] );
	} );
} );

describe( 'menuLabel', () => {
	it( 'reads the sidebar label without its count badge', () => {
		document.body.innerHTML =
			'<ul id="adminmenu"><li><ul class="wp-submenu"><li><a href="admin.php?page=forms">Forms <span class="menu-counter"><span class="count">3</span></span></a></li></ul></li></ul>';

		expect( menuLabel( 'forms' ) ).toBe( 'Forms' );
	} );

	it( 'reads a top-level item’s label from its menu name', () => {
		document.body.innerHTML =
			'<ul id="adminmenu"><li><a href="admin.php?page=activity-log"><div class="wp-menu-image"></div><div class="wp-menu-name">Activity Log</div></a></li></ul>';

		expect( menuLabel( 'activity-log' ) ).toBe( 'Activity Log' );
	} );
} );

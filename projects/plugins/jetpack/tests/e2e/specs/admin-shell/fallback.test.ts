import { test, expect } from '@playwright/test';
import {
	expectShown,
	installShellProbe,
	isShellActive,
	markDocument,
	menuLink,
	openMember,
	sameDocument,
	waitForShown,
} from '../../helpers/admin-shell-helper';

const FORMS = 'jetpack-forms-responses-wp-admin';

test.describe( 'Admin shell: fallback', () => {
	test.beforeEach( async ( { page } ) => {
		await installShellProbe( page );
	} );

	// The shell never starts for the request, so every member link is a plain link; one is enough.
	test( 'with ?jetpack_admin_shell=0, clicking Forms is a full page load', async ( { page } ) => {
		await page.goto( '/wp-admin/admin.php?page=my-jetpack&jetpack_admin_shell=0' );
		await waitForShown( page, 'my-jetpack' );
		expect( await isShellActive( page ), 'shell is off for this request' ).toBe( false );
		await markDocument( page );
		await menuLink( page, FORMS ).click();
		await waitForShown( page, FORMS );
		expect( await sameDocument( page ), 'a new document loaded' ).toBe( false );
	} );

	test(
		'a failing guest endpoint still gets the user to the page',
		{ tag: '@smoke' },
		async ( { page } ) => {
			let aborted = 0;
			await page.route( /admin-ajax\.php\?.*action=jetpack_admin_shell_guest/, route => {
				aborted++;
				return route.abort();
			} );
			await openMember( page, 'my-jetpack' );
			await menuLink( page, FORMS ).click();
			await waitForShown( page, FORMS );
			expect( aborted, 'the guest endpoint was called and failed' ).toBeGreaterThan( 0 );
			await expectShown( page, FORMS );
			expect( new URL( page.url() ).searchParams.get( 'page' ) ).toBe( FORMS );
		}
	);
} );

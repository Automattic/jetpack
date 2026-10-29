import { test, expect, type Page } from '@playwright/test';
import {
	MEMBERS,
	expectShown,
	installShellProbe,
	isShellActive,
	menuLink,
	openMember,
	waitForShown,
} from '../../helpers/admin-shell-helper';

const markDocument = ( page: Page ) =>
	page.evaluate(
		() => ( ( window as unknown as { __sameDocument: boolean } ).__sameDocument = true )
	);
const sameDocument = ( page: Page ) =>
	page.evaluate( () => !! ( window as unknown as { __sameDocument?: boolean } ).__sameDocument );

test.describe( 'Admin shell: fallback', () => {
	test.beforeEach( async ( { page } ) => {
		await installShellProbe( page );
	} );

	for ( const m of MEMBERS.filter( x => x.slug !== 'my-jetpack' ) ) {
		test( `with ?jetpack_admin_shell=0, clicking ${ m.slug } is a full page load`, async ( {
			page,
		} ) => {
			test.fail(
				true,
				'Known spike gap: no ?jetpack_admin_shell=0 kill switch yet (contract item 5).'
			);
			await page.goto( '/wp-admin/admin.php?page=my-jetpack&jetpack_admin_shell=0' );
			await waitForShown( page, 'my-jetpack' );
			expect( await isShellActive( page ), 'shell is off for this request' ).toBe( false );
			await markDocument( page );
			await menuLink( page, m.slug ).click();
			await waitForShown( page, m.slug );
			expect( await sameDocument( page ), 'a new document loaded' ).toBe( false );
		} );
	}

	test( 'a failing guest endpoint still gets the user to the page', async ( { page } ) => {
		await page.route( /admin-ajax\.php\?.*action=jetpack_admin_shell_guest/, route =>
			route.abort()
		);
		await openMember( page, 'my-jetpack' );
		await menuLink( page, 'jetpack-newsletter' ).click();
		await waitForShown( page, 'jetpack-newsletter' );
		await expectShown( page, 'jetpack-newsletter' );
		expect( new URL( page.url() ).searchParams.get( 'page' ) ).toBe( 'jetpack-newsletter' );
	} );
} );

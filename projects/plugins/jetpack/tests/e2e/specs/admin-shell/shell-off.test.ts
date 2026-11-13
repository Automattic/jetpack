import { test, expect } from '@playwright/test';
import {
	MEMBERS,
	expectShown,
	installShellProbe,
	isShellActive,
	menuLink,
	onSite,
	waitForShown,
	where,
} from '../../helpers/admin-shell-helper';

/* The default path: the same pages with the shell off, each sidebar click a full load. */
test.describe( 'Admin shell off: smoke', () => {
	test.skip(
		! process.env.ADMIN_SHELL_OFF_URL,
		'Needs ADMIN_SHELL_OFF_URL, a site with the shell off'
	);

	test.beforeEach( async ( { page } ) => {
		await installShellProbe( page );
	} );

	test( 'every member loads and links to the next', async ( { page } ) => {
		const [ first, ...rest ] = MEMBERS;
		await page.goto( `/wp-admin/admin.php?page=${ first.slug }` );
		await waitForShown( page, first.slug );
		await expectShown( page, first.slug );
		const present = await Promise.all( rest.map( m => onSite( page, m.slug ) ) );
		for ( const m of rest.filter( ( _, i ) => present[ i ] ) ) {
			await menuLink( page, m.slug ).click();
			await waitForShown( page, m.slug );
			expect( await isShellActive( page ), 'shell is off' ).toBe( false );
			await expectShown( page, m.slug );
			await expect.poll( () => where( page ) ).toMatch( m.landing );
		}
	} );
} );

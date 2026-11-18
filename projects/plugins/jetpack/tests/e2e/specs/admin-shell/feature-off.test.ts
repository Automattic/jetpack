import { test, expect, type Page } from '@playwright/test';
import {
	announcements,
	installA11yProbe,
	resetA11yProbe,
} from '../../helpers/admin-shell-a11y-helper';
import {
	installShellProbe,
	member,
	openMember,
	shellEvents,
	switchTo,
	waitForShown,
	withinDocument,
} from '../../helpers/admin-shell-helper';

const MJ = 'my-jetpack';
const FORMS = 'jetpack-forms-responses-wp-admin';

/**
 * Switch Forms on or off as the Features tab does, from the signed-in session.
 *
 * @param page   - Page under test.
 * @param active - Whether to switch it on.
 */
async function switchForms( page: Page, active: boolean ): Promise< void > {
	const ok = await page.evaluate( async on => {
		const nonce = await ( await fetch( '/wp-admin/admin-ajax.php?action=rest-nonce' ) ).text();
		// `rest_route`: the e2e site has no pretty permalinks, and there `/wp-json/` serves the home page with a 200.
		const response = await fetch( '/?rest_route=/wpcom/v2/my-jetpack/site/features/bulk', {
			method: 'POST',
			headers: { 'X-WP-Nonce': nonce, 'Content-Type': 'application/json' },
			body: JSON.stringify( { active: on, modules: [ 'contact-form' ] } ),
		} );
		return response.ok && ( response.headers.get( 'content-type' ) ?? '' ).includes( 'json' );
	}, active );
	expect( ok, `Forms switched ${ active ? 'on' : 'off' }` ).toBe( true );
}

const panel = ( page: Page ) =>
	page.locator( `[data-shell-page="${ FORMS }"][data-shell-state="off"]` );

/**
 * Open Forms in the shell, switch it off from My Jetpack, and go Back to it.
 *
 * @param page - Page under test.
 * @return How many shell events fired before the Back.
 */
async function backToSwitchedOffForms( page: Page ): Promise< number > {
	await openMember( page, MJ );
	await switchTo( page, FORMS );
	await switchTo( page, MJ );
	await switchForms( page, false );
	await resetA11yProbe( page );
	const before = ( await shellEvents( page ) ).length;
	await withinDocument( page, 'Back to Forms', async () => {
		await page.goBack();
		await expect( panel( page ) ).toBeVisible();
	} );
	return before;
}

test.describe( 'Admin shell: a page whose feature was switched off', () => {
	test.beforeEach( async ( { page } ) => {
		await installShellProbe( page );
		await installA11yProbe( page );
	} );

	test.afterEach( async ( { page } ) => {
		await page.goto( '/wp-admin/admin.php?page=my-jetpack&jetpack_admin_shell=0' );
		await switchForms( page, true );
	} );

	test( 'Back to it shows the turned-off card, focused and announced, in place of the page', async ( {
		page,
	} ) => {
		const before = await backToSwitchedOffForms( page );

		const heading = panel( page ).getByRole( 'heading', { level: 1 } );
		await expect( heading ).toBeFocused();
		// Focus inside an aria-hidden or inert subtree is focus a screen reader never hears.
		expect(
			await heading.evaluate( el => !! el.closest( '[aria-hidden="true"], [inert]' ) ),
			'the focused heading is exposed to assistive technology'
		).toBe( false );
		await expect
			.poll( () => announcements( page ), 'the page title is announced' )
			.toContainEqual(
				expect.objectContaining( {
					politeness: 'polite',
					text: expect.stringContaining( member( FORMS ).title ),
				} )
			);
		const shown = ( await shellEvents( page ) )
			.slice( before )
			.filter( event => event.type.endsWith( 'page-shown' ) );
		expect( shown, 'Forms is not reported shown while the card covers it' ).toEqual( [] );
	} );

	test( 'Turn on in the card brings the page back', async ( { page } ) => {
		await backToSwitchedOffForms( page );

		await panel( page )
			.getByRole( 'button', { name: /^Turn on/ } )
			.click();

		await waitForShown( page, FORMS );
		await expect( panel( page ) ).toHaveCount( 0 );
	} );
} );

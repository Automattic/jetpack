import { test, expect, type Page } from '@playwright/test';
import {
	MEMBERS,
	expectShown,
	installShellProbe,
	menuLink,
	openMember,
	skipUnlessOnSite,
	switchTo,
	waitForShown,
	where,
	withinDocument,
} from '../../helpers/admin-shell-helper';

const FORMS = 'jetpack-forms-responses-wp-admin';

const historyLength = ( page: Page ) => page.evaluate( () => history.length );

const back = ( page: Page, slug: string ) =>
	withinDocument( page, `Back to ${ slug }`, async () => {
		await page.goBack();
		await waitForShown( page, slug );
	} );

const forward = ( page: Page, slug: string ) =>
	withinDocument( page, `Forward to ${ slug }`, async () => {
		await page.goForward();
		await waitForShown( page, slug );
	} );

test.describe( 'Admin shell: history', () => {
	test.beforeEach( async ( { page } ) => {
		await installShellProbe( page );
	} );

	test( 'Back and Forward step through members one click at a time', async ( { page } ) => {
		await openMember( page, 'my-jetpack' );
		const start = await historyLength( page );
		await switchTo( page, FORMS );
		await switchTo( page, 'my-jetpack' );
		expect( await historyLength( page ), 'one entry per click' ).toBe( start + 2 );

		await back( page, FORMS );
		await expectShown( page, FORMS );
		await back( page, 'my-jetpack' );
		expect( await where( page ) ).toMatch( /^\?page=my-jetpack/ );
		await forward( page, FORMS );
		await forward( page, 'my-jetpack' );
		await expectShown( page, 'my-jetpack' );
	} );

	/* `p` routes inside a product: each tab is a history entry, in and out of the shell. */
	const tabRoutes = [
		{
			slug: 'my-jetpack',
			via: FORMS,
			tabs: [ /^Features$/, /^Help$/ ],
			urls: [ /p=%2Ffeatures$/, /p=%2Fhelp$/ ],
		},
		{
			slug: FORMS,
			via: 'my-jetpack',
			tabs: [ /^Responses/, /^Forms/ ],
			urls: [ /p=%2Fresponses/, /p=%2Fforms$/ ],
		},
	];
	for ( const { slug, via, tabs, urls } of tabRoutes ) {
		test( `Back walks ${ slug } tabs after leaving and returning`, async ( { page } ) => {
			await openMember( page, slug );
			for ( const [ i, tab ] of tabs.entries() ) {
				// A click during the previous route's view transition lands on its overlay; click again.
				await expect( async () => {
					await page.getByRole( 'tab', { name: tab } ).filter( { visible: true } ).click();
					await expect
						.poll( () => where( page ), { message: `${ tab } is in the URL`, timeout: 3000 } )
						.toMatch( urls[ i ] );
				} ).toPass( { timeout: 20000 } );
			}
			await switchTo( page, via );
			await back( page, slug );
			expect( await where( page ) ).toMatch( urls[ 1 ] );
			await withinDocument( page, `Back to ${ tabs[ 0 ] }`, async () => {
				await page.goBack();
				await expect.poll( () => where( page ) ).toMatch( urls[ 0 ] );
			} );
			await expect(
				page.getByRole( 'tab', { name: tabs[ 0 ] } ).filter( { visible: true } )
			).toHaveAttribute( 'aria-selected', 'true' );
		} );
	}

	for ( const m of MEMBERS ) {
		test( `full load of ${ m.slug } renders with the shell on`, async ( { page } ) => {
			await skipUnlessOnSite( page, m.slug );
			await openMember( page, m.slug );
			await expectShown( page, m.slug );
			expect( await where( page ) ).toMatch( m.landing );
		} );
	}

	test( 'reload keeps the member that was switched to', async ( { page } ) => {
		await openMember( page, 'my-jetpack' );
		await switchTo( page, FORMS );
		const url = await where( page );
		await page.reload();
		await waitForShown( page, FORMS );
		await expectShown( page, FORMS );
		expect( await where( page ) ).toBe( url );
	} );

	test( 'a deep link opens its tab, which survives a round trip', async ( { page } ) => {
		await openMember( page, 'my-jetpack', '&p=%2Fhelp' );
		const help = page.getByRole( 'tab', { name: 'Help' } ).filter( { visible: true } );
		await expect( help ).toHaveAttribute( 'aria-selected', 'true' );
		await switchTo( page, FORMS );
		await switchTo( page, 'my-jetpack' );
		await expect( help ).toHaveAttribute( 'aria-selected', 'true' );
		expect( await where( page ) ).toBe( '?page=my-jetpack&p=%2Fhelp' );
	} );

	test( 'opening a member in a new tab leaves this one alone', async ( { page, context } ) => {
		await openMember( page, 'my-jetpack' );
		const before = await where( page );
		const [ opened ] = await Promise.all( [
			context.waitForEvent( 'page' ),
			menuLink( page, FORMS ).click( { modifiers: [ 'ControlOrMeta' ] } ),
		] );
		await opened.waitForURL( /page=jetpack-forms-responses-wp-admin/ );
		expect( await where( page ) ).toBe( before );
		await expectShown( page, 'my-jetpack' );
	} );
} );

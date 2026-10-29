import { test, expect, type Page } from '@playwright/test';
import {
	MEMBERS,
	expectShown,
	installShellProbe,
	menuLink,
	openMember,
	settle,
	switchTo,
	waitForShown,
	where,
} from '../../helpers/admin-shell-helper';

const historyLength = ( page: Page ) => page.evaluate( () => history.length );

test.describe( 'Admin shell: history', () => {
	test.beforeEach( async ( { page } ) => {
		await installShellProbe( page );
	} );

	test( 'Back and Forward step through members one click at a time', async ( { page } ) => {
		await openMember( page, 'my-jetpack' );
		const start = await historyLength( page );
		await switchTo( page, 'jetpack-activity-log' );
		await switchTo( page, 'jetpack-newsletter' );
		expect( await historyLength( page ), 'one entry per click' ).toBe( start + 2 );

		await page.goBack();
		await waitForShown( page, 'jetpack-activity-log' );
		await expectShown( page, 'jetpack-activity-log' );
		await page.goBack();
		await waitForShown( page, 'my-jetpack' );
		expect( await where( page ) ).toMatch( /^\?page=my-jetpack/ );
		await page.goForward();
		await waitForShown( page, 'jetpack-activity-log' );
		await page.goForward();
		await waitForShown( page, 'jetpack-newsletter' );
		await expectShown( page, 'jetpack-newsletter' );
	} );

	test( 'Back after a framed page (Stats) needs one press', async ( { page } ) => {
		test.fail(
			true,
			'Known spike bug: Stats adds its own history entry, so Back needs an extra press.'
		);
		await openMember( page, 'my-jetpack' );
		const start = await historyLength( page );
		await page.locator( '#adminmenu a[href$="page=stats"]' ).first().click();
		await expect.poll( () => where( page ) ).toMatch( /^\?page=stats/ );
		await settle( page, 5000 );
		expect( await historyLength( page ), 'Stats adds one entry' ).toBe( start + 1 );
		await page.goBack();
		await waitForShown( page, 'my-jetpack' );
		expect( await where( page ) ).toMatch( /^\?page=my-jetpack/ );
	} );

	/* Hash and `p` routes inside a product: each tab is a history entry, in and out of the shell. */
	const tabRoutes = [
		{
			slug: 'my-jetpack',
			via: 'jetpack-podcast',
			tabs: [ 'Features', 'Help' ],
			urls: [ /#\/features$/, /#\/help$/ ],
		},
		{
			slug: 'jetpack-ai',
			via: 'my-jetpack',
			tabs: [ 'AI Features', 'MCP and Connectors' ],
			urls: [ /#\/features$/, /#\/mcp$/ ],
		},
		{
			slug: 'jetpack-newsletter',
			via: 'my-jetpack',
			tabs: [ 'Subscribers', 'Settings' ],
			urls: [ /p=%2F%3Ftab%3Dsubscribers$/, /p=%2F%3Ftab%3Dsettings$/ ],
		},
	];
	for ( const { slug, via, tabs, urls } of tabRoutes ) {
		test( `Back walks ${ slug } tabs after leaving and returning`, async ( { page } ) => {
			await openMember( page, slug );
			for ( const [ i, tab ] of tabs.entries() ) {
				await page.getByRole( 'tab', { name: tab } ).filter( { visible: true } ).click();
				await expect.poll( () => where( page ), `${ tab } is in the URL` ).toMatch( urls[ i ] );
			}
			await switchTo( page, via );
			await page.goBack();
			await waitForShown( page, slug );
			expect( await where( page ) ).toMatch( urls[ 1 ] );
			await page.goBack();
			await expect.poll( () => where( page ) ).toMatch( urls[ 0 ] );
			await expect(
				page.getByRole( 'tab', { name: tabs[ 0 ] } ).filter( { visible: true } )
			).toHaveAttribute( 'aria-selected', 'true' );
		} );
	}

	for ( const m of MEMBERS ) {
		test( `full load of ${ m.slug } renders with the shell on`, async ( { page } ) => {
			await openMember( page, m.slug );
			await expectShown( page, m.slug );
			expect( await where( page ) ).toMatch( m.landing );
		} );
	}

	test( 'reload keeps the member that was switched to', async ( { page } ) => {
		await openMember( page, 'my-jetpack' );
		await switchTo( page, 'jetpack-forms-responses-wp-admin' );
		const url = await where( page );
		await page.reload();
		await waitForShown( page, 'jetpack-forms-responses-wp-admin' );
		await expectShown( page, 'jetpack-forms-responses-wp-admin' );
		expect( await where( page ) ).toBe( url );
	} );

	test( 'a deep link opens its tab, which survives a round trip', async ( { page } ) => {
		await openMember( page, 'my-jetpack', '#/help' );
		const help = page.getByRole( 'tab', { name: 'Help' } ).filter( { visible: true } );
		await expect( help ).toHaveAttribute( 'aria-selected', 'true' );
		await switchTo( page, 'jetpack-newsletter' );
		await switchTo( page, 'my-jetpack' );
		await expect( help ).toHaveAttribute( 'aria-selected', 'true' );
		expect( await where( page ) ).toBe( '?page=my-jetpack#/help' );
	} );

	test( 'opening a member in a new tab leaves this one alone', async ( { page, context } ) => {
		await openMember( page, 'my-jetpack' );
		const before = await where( page );
		const [ opened ] = await Promise.all( [
			context.waitForEvent( 'page' ),
			menuLink( page, 'jetpack-newsletter' ).click( { modifiers: [ 'ControlOrMeta' ] } ),
		] );
		await opened.waitForURL( /page=jetpack-newsletter/ );
		expect( await where( page ) ).toBe( before );
		await expectShown( page, 'my-jetpack' );
	} );
} );

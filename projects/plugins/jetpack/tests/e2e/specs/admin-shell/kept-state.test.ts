import { test, expect } from '@playwright/test';
import { installShellProbe, openMember, switchTo, where } from '../../helpers/admin-shell-helper';

const FORMS = 'jetpack-forms-responses-wp-admin';

test.describe( 'Admin shell: state survives a round trip', () => {
	test.beforeEach( async ( { page } ) => {
		await installShellProbe( page );
	} );

	test( 'My Jetpack keeps its tab after visiting Forms', async ( { page } ) => {
		// Start elsewhere so My Jetpack is a guest app, as most visits to it are.
		await openMember( page, FORMS );
		await switchTo( page, 'my-jetpack' );
		const features = page.getByRole( 'tab', { name: 'Features' } ).filter( { visible: true } );
		await features.click();
		await expect( features ).toHaveAttribute( 'aria-selected', 'true' );
		const url = await where( page );

		await switchTo( page, FORMS );
		await switchTo( page, 'my-jetpack' );
		await expect( features ).toHaveAttribute( 'aria-selected', 'true' );
		expect( await where( page ) ).toBe( url );
	} );

	test( 'Forms keeps its tab and search', async ( { page } ) => {
		await openMember( page, FORMS );
		const responses = page.getByRole( 'tab', { name: /^Responses/ } ).filter( { visible: true } );
		await responses.click();
		await expect( responses ).toHaveAttribute( 'aria-selected', 'true' );
		const search = page
			.locator( '#wpbody-content input[type="search"]' )
			.filter( { visible: true } );
		await search.fill( 'shell-regression' );
		await expect
			.poll( () => where( page ), 'search reaches the URL' )
			.toContain( 'shell-regression' );
		const url = await where( page );

		await switchTo( page, 'my-jetpack' );
		await switchTo( page, FORMS );
		await expect( responses ).toHaveAttribute( 'aria-selected', 'true' );
		await expect( search ).toHaveValue( 'shell-regression' );
		expect( await where( page ) ).toBe( url );
	} );

	test( 'scroll position survives a round trip', async ( { page } ) => {
		await page.setViewportSize( { width: 1280, height: 500 } );
		await openMember( page, 'my-jetpack' );
		const room = await page.evaluate( () => document.documentElement.scrollHeight - innerHeight );
		test.skip( room < 200, 'My Jetpack is not tall enough to scroll here' );
		await page.mouse.wheel( 0, 200 );
		await expect.poll( () => page.evaluate( () => scrollY ) ).toBeGreaterThan( 100 );
		const scrolled = await page.evaluate( () => scrollY );

		await switchTo( page, FORMS );
		await switchTo( page, 'my-jetpack' );
		await expect.poll( () => page.evaluate( () => scrollY ) ).toBe( scrolled );
	} );
} );

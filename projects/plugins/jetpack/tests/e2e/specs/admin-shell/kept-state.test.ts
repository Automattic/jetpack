import { test, expect } from '@playwright/test';
import {
	installShellProbe,
	menuLink,
	openMember,
	switchTo,
	where,
} from '../../helpers/admin-shell-helper';

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
		// Playwright scrolls a link out from under the fixed admin bar before clicking it, moving the page.
		const belowAdminBar = await menuLink( page, FORMS ).evaluate(
			a =>
				a.getBoundingClientRect().top -
				document.getElementById( 'wpadminbar' )!.getBoundingClientRect().bottom
		);
		const room = await page.evaluate( () => document.documentElement.scrollHeight - innerHeight );
		const scrolled = Math.floor( Math.min( 200, room, belowAdminBar - 8 ) );
		test.skip(
			scrolled < 100,
			'My Jetpack cannot scroll far enough here with the Forms link in view'
		);
		await page.mouse.wheel( 0, scrolled );
		// The wheel can scroll smoothly: wait for it to land.
		await expect.poll( () => page.evaluate( () => Math.round( scrollY ) ) ).toBe( scrolled );
		await page.evaluate( () =>
			document.addEventListener(
				'click',
				() => ( document.documentElement.dataset.scrollAtClick = String( Math.round( scrollY ) ) ),
				{ capture: true, once: true }
			)
		);

		await switchTo( page, FORMS );
		expect(
			Number( await page.locator( 'html' ).getAttribute( 'data-scroll-at-click' ) ),
			'the click scrolled the page first: is the Forms link under the admin bar?'
		).toBe( scrolled );
		await expect.poll( () => page.evaluate( () => scrollY ), 'Forms opens at the top' ).toBe( 0 );
		await switchTo( page, 'my-jetpack' );
		await expect.poll( () => page.evaluate( () => Math.round( scrollY ) ) ).toBe( scrolled );
	} );
} );

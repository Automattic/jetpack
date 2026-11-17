import { test, expect } from '@playwright/test';
import {
	installShellProbe,
	markDocument,
	menuLink,
	openMember,
	sameDocument,
	skipUnlessOnSite,
	switchTo,
	waitForShown,
	withinDocument,
} from '../../helpers/admin-shell-helper';

const FORMS = 'jetpack-forms-responses-wp-admin';

test.describe( 'Admin shell: memory budget', () => {
	test.beforeEach( async ( { page } ) => {
		// A 2 GB device: three dashboards may be live at once.
		await page.addInitScript( () =>
			Object.defineProperty( Navigator.prototype, 'deviceMemory', { get: () => 2 } )
		);
		await installShellProbe( page );
	} );

	test( 'past the live-app limit, a new dashboard is a full page load', async ( { page } ) => {
		await skipUnlessOnSite( page, 'jetpack-seo', 'jetpack-boost' );
		await openMember( page, 'my-jetpack' );
		await switchTo( page, FORMS );
		await switchTo( page, 'jetpack-seo' );
		// Live dashboards still switch in place at the limit.
		await switchTo( page, FORMS );

		await markDocument( page );
		await menuLink( page, 'jetpack-boost' ).click();
		await waitForShown( page, 'jetpack-boost' );
		expect( await sameDocument( page ), 'a new document loaded' ).toBe( false );

		// The page load freed the budget.
		await switchTo( page, 'my-jetpack' );
	} );

	test( 'past the live-app limit, a hidden dashboard with unsaved changes keeps the page', async ( {
		page,
	} ) => {
		await skipUnlessOnSite( page, 'jetpack-seo', 'jetpack-boost' );
		await openMember( page, 'my-jetpack' );
		await switchTo( page, FORMS );
		await switchTo( page, 'jetpack-seo' );
		// Stands in for My Jetpack with an unsaved edit whose user chooses to stay.
		await page.evaluate( () =>
			window.addEventListener( 'jetpack-admin-shell:before-leave', event => {
				const { detail } = event as CustomEvent< { page: string; url: string } >;
				if ( detail.page === 'my-jetpack' ) {
					( window as unknown as { __askedFor?: string } ).__askedFor = detail.url;
					event.preventDefault();
				}
			} )
		);

		await withinDocument( page, 'the cancelled page load', async () => {
			await menuLink( page, 'jetpack-boost' ).click();
			await expect
				.poll( () =>
					page.evaluate( () => ( window as unknown as { __askedFor?: string } ).__askedFor ?? '' )
				)
				.toContain( 'page=jetpack-boost' );
		} );
		expect( new URL( page.url() ).searchParams.get( 'page' ) ).toBe( 'jetpack-seo' );
	} );
} );

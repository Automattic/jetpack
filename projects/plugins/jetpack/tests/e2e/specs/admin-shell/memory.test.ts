import { test, expect } from '@playwright/test';
import {
	installShellProbe,
	markDocument,
	menuLink,
	openMember,
	sameDocument,
	switchTo,
	waitForShown,
	withinDocument,
} from '../../helpers/admin-shell-helper';

const FORMS = 'jetpack-forms-responses-wp-admin';
/* Members every CI site has, so the test runs there. */
const AI = 'jetpack-ai';
const PODCAST = 'jetpack-podcast';

test.describe( 'Admin shell: memory budget', () => {
	test.beforeEach( async ( { page } ) => {
		// A 2 GB device: three dashboards may be live at once.
		await page.addInitScript( () =>
			Object.defineProperty( Navigator.prototype, 'deviceMemory', { get: () => 2 } )
		);
		await installShellProbe( page );
	} );

	test( 'past the live-app limit, a new dashboard is a full page load', async ( { page } ) => {
		await openMember( page, 'my-jetpack' );
		await switchTo( page, FORMS );
		await switchTo( page, AI );
		// Live dashboards still switch in place at the limit.
		await switchTo( page, FORMS );

		await markDocument( page );
		await menuLink( page, PODCAST ).click();
		await waitForShown( page, PODCAST );
		expect( await sameDocument( page ), 'a new document loaded' ).toBe( false );

		// The page load freed the budget.
		await switchTo( page, 'my-jetpack' );
	} );

	test( 'past the live-app limit, a hidden dashboard with unsaved changes keeps the page', async ( {
		page,
	} ) => {
		await openMember( page, 'my-jetpack' );
		await switchTo( page, FORMS );
		await switchTo( page, AI );
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
			await menuLink( page, PODCAST ).click();
			await expect
				.poll( () =>
					page.evaluate( () => ( window as unknown as { __askedFor?: string } ).__askedFor ?? '' )
				)
				.toContain( 'page=jetpack-podcast' );
		} );
		expect( new URL( page.url() ).searchParams.get( 'page' ) ).toBe( AI );
	} );
} );

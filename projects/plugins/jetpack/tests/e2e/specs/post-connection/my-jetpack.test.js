import { test, expect } from 'jetpack-e2e-commons/fixtures/base-test.js';
import { MyJetpackPage } from 'jetpack-e2e-commons/pages/wp-admin/index.js';
import playwrightConfig from '../../playwright.config.cjs';
import { Plans, prerequisitesBuilder } from 'jetpack-e2e-commons/env/index.js';

test.describe.parallel( 'My Jetpack loading', () => {
	test.beforeAll( async ( { browser } ) => {
		const page = await browser.newPage( playwrightConfig.use );
		/*
		 * Just a basic free fully-connected site.
		 */
		await prerequisitesBuilder( page )
			.withCleanEnv()
			.withWpComLoggedIn( true )
			.withLoggedIn( true )
			.withConnection( true )
			.withPlan( Plans.Free )
			.build();
		await page.close();
	} );

	test( 'Connection status card is showing', async ( { page } ) => {
		let myJetpackPage;
		await test.step( 'Load My Jetpack page', async () => {
			myJetpackPage = await MyJetpackPage.visit( page );
			const isPageVisible = await myJetpackPage.isConnectionStatusCardDisplaying();
			expect( isPageVisible, 'Connection Card should be showing' ).toBeTruthy();
		} );
	} );
} );

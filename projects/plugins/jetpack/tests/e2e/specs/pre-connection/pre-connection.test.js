import { prerequisitesBuilder } from 'jetpack-e2e-commons/env/index.js';
import { test, expect } from 'jetpack-e2e-commons/fixtures/base-test.js';
import { Sidebar, DashboardPage, JetpackPage } from 'jetpack-e2e-commons/pages/wp-admin/index.js';
import playwrightConfig from '../../playwright.config.mjs';

test.beforeAll( async ( { browser } ) => {
	const page = await browser.newPage( playwrightConfig.use );
	await prerequisitesBuilder( page ).withCleanEnv().withLoggedIn( true ).build();
	await page.close();
} );

test.beforeEach( async ( { page } ) => {
	await DashboardPage.visit( page );
} );

test( 'Connect button is displayed  on Jetpack page', async ( { page } ) => {
	await ( await Sidebar.init( page ) ).selectJetpackSubMenuItem();

	const jetpackPage = await JetpackPage.init( page );
	expect(
		await jetpackPage.isConnectScreenVisible(),
		'Connect screen should be visible'
	).toBeTruthy();
} );

import { test } from '@playwright/test';
import { Sidebar, DashboardPage } from 'jetpack-e2e-commons/pages/wp-admin/index.js';
import { prerequisitesBuilder } from 'jetpack-e2e-commons/env/prerequisites.js';
import playwrightConfig from '../playwright.config.cjs';

test.describe( 'Starter plugin!', () => {
	test.beforeEach( async ( { browser } ) => {
		const page = await browser.newPage( playwrightConfig.use );
		await prerequisitesBuilder( page ).withCleanEnv().withLoggedIn( true ).build();
		await page.close();
	} );

	test( 'Visit Jetpack page', async ( { page } ) => {
		await DashboardPage.visit( page );
		await ( await Sidebar.init( page ) ).selectJetpack();
	} );
} );

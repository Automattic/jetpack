import { test, expect } from '@playwright/test';
import { Sidebar, DashboardPage } from '_jetpack-e2e-commons/pages/wp-admin/index.js';

test.describe( 'Starter Plugin!', () => {
	test( 'Visit Jetpack page', async ( { page } ) => {
		await DashboardPage.visit( page );
		await ( await Sidebar.init( page ) ).selectJetpack();
		await expect( page ).toHaveURL( /jetpack/ );
	} );
} );

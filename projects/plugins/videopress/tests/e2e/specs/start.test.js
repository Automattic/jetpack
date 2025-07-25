import { test } from '@playwright/test';
import { Sidebar, DashboardPage } from '_jetpack-e2e-commons/pages/wp-admin/index.js';

test.describe( 'VideoPress plugin!', () => {
	// eslint-disable-next-line playwright/expect-expect -- TODO: Fix/justify this.
	test( 'Visit Jetpack page', async ( { page } ) => {
		await DashboardPage.visit( page );
		await ( await Sidebar.init( page ) ).selectJetpackSubMenuItem();
	} );
} );

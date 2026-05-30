import { test, expect } from '../fixtures/test';
import { clearSearchPlanInfo } from '../utils/search-utils';

test.describe( 'Search Dashboard', () => {
	test.beforeAll( async ( { testUtils } ) => {
		await clearSearchPlanInfo();
		await testUtils.activateModule( 'search' );
	} );

	test( 'Renders the Experience Selector on the Settings tab.', async ( { page } ) => {
		await page.goto( '/wp-admin/admin.php?page=jetpack-search' );

		await expect(
			page.getByRole( 'heading', { name: 'Help your visitors find' } ),
			'Dashboard heading should be visible'
		).toBeVisible( { timeout: 30000 } );

		await page.getByRole( 'tab', { name: 'Settings' } ).click();

		await expect(
			page.getByRole( 'heading', {
				level: 2,
				name: 'Select a search experience for your visitors',
			} ),
			'Experience Selector heading should be visible'
		).toBeVisible();
	} );
} );

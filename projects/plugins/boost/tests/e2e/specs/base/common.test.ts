import { executeWpDbQuery } from '@automattic/_jetpack-e2e-commons/utils/cli';
import { test, expect } from '../../lib/fixtures/test';

test.describe( 'Common tests', () => {
	test.beforeAll( async ( { boostUtils } ) => {
		await boostUtils.resetEnvironment();
		await boostUtils.mockConnection();
		await boostUtils.mockSpeedScore();
	} );

	test.afterAll( async ( { boostUtils } ) => {
		await boostUtils.unMockConnection();
		await boostUtils.unMockSpeedScore();
	} );

	test( 'Click on the plugins page should navigate to Boost settings page', async ( {
		admin,
		page,
	} ) => {
		await admin.visitAdminPage( 'plugins.php' );
		await page
			.locator( "tr[data-slug='jetpack-boost']" )
			.getByRole( 'link', { name: 'Settings' } )
			.click();
		expect( page.url(), "URL should contain 'page=jetpack-boost" ).toContain(
			'page=jetpack-boost'
		);
	} );

	test( 'Click on the sidebar Boost Jetpack submenu should navigate to Boost settings page', async ( {
		page,
		sidebar,
	} ) => {
		await page.goto( 'wp-admin/index.php' );
		await sidebar.selectJetpackBoost();
		expect( page.url(), "URL should contain 'page=jetpack-boost" ).toContain(
			'page=jetpack-boost'
		);
	} );

	test( 'Deactivating the plugin should clear Critical CSS and Dismissed Recommendation notice option', async ( {
		boostUtils,
		jetpackBoostPage,
		admin,
		page,
	} ) => {
		// Generate Critical CSS to ensure that on plugin deactivation it is cleared.
		// TODO: Also should make sure that a Critical CSS recommendation is dismissed to check that the options does not exist after deactivation of the plugin.
		await test.step( 'Setup clean environment and activate critical CSS module', async () => {
			await boostUtils.resetEnvironment();
			await boostUtils.mockConnection();
			await boostUtils.activateBoostModule( 'critical_css' );
		} );

		await test.step( 'Navigate to Boost settings and verify Critical CSS generation', async () => {
			/*
			 * page.waitForResponse() only matches responses that arrive after it is
			 * attached, so start listening before the navigation that kicks off
			 * generation. This is a cold generation (fresh environment + module
			 * activation), so use the 240s ceiling rather than the 60s default; the
			 * wait still resolves as soon as the terminal state arrives — the ceiling
			 * only guards against flakiness on slow CI runners.
			 */
			const criticalCssGenerated = jetpackBoostPage.waitForCriticalCssGeneration( 240000 );
			await admin.visitAdminPage( 'admin.php', 'page=jetpack-boost' );
			await expect(
				page.locator( '.jb-critical-css-progress' ),
				'Critical CSS generation progress indicator should be visible'
			).toBeVisible();
			await criticalCssGenerated;
			await expect(
				page.getByTestId( 'critical-css-meta' ),
				'Critical CSS meta information should be visible'
			).toBeVisible();
		} );

		await test.step( 'Deactivate Jetpack Boost plugin', async () => {
			await admin.visitAdminPage( 'plugins.php' );
			await page
				.locator( "tr[data-slug='jetpack-boost']" )
				.getByRole( 'link', { name: 'Deactivate' } )
				.click();
			await page.getByRole( 'button', { name: 'Just Deactivate' } ).click();
		} );

		await test.step( 'Verify database records are cleared and reactivate plugin', async () => {
			const posts = await executeWpDbQuery(
				'SELECT ID FROM wp_posts WHERE post_type LIKE "%jb_store_%"',
				[ '--skip-column-names' ]
			);
			expect( posts, 'No jb_store_ posts DB records are found' ).toHaveLength( 0 );

			const options = await executeWpDbQuery(
				'SELECT option_id FROM wp_options WHERE option_name = "jb-critical-css-dismissed-recommendations"',
				[ '--skip-column-names' ]
			);
			expect(
				options,
				'jb-critical-css-dismissed-recommendations option is not found in DB'
			).toHaveLength( 0 );
		} );
	} );
} );

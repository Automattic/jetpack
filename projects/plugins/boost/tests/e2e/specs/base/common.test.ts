import playwrightConfig from '_jetpack-e2e-commons/playwright.config.mjs';
import { executeWpDbQuery } from '_jetpack-e2e-commons/utils/cli.ts';
import { boostPrerequisitesBuilder } from '../../lib/env/prerequisites.js';
import { test, expect } from '../../lib/fixtures/test.ts';

test.describe( 'Common tests', () => {
	test.beforeAll( async ( { browser } ) => {
		const page = await browser.newPage( playwrightConfig.use );
		await boostPrerequisitesBuilder( page )
			.withCleanEnv()
			.withMockConnection( true )
			.withSpeedScoreMocked( true )
			.build();
		await page.close();
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
		await page.goto( '/wp-admin' );
		await sidebar.selectJetpackBoost();
		expect( page.url(), "URL should contain 'page=jetpack-boost" ).toContain(
			'page=jetpack-boost'
		);
	} );

	test( 'Deactivating the plugin should clear Critical CSS and Dismissed Recommendation notice option', async ( {
		testUtils,
		admin,
		page,
		jetpackBoostPage,
	} ) => {
		// Generate Critical CSS to ensure that on plugin deactivation it is cleared.
		// TODO: Also should make sure that a Critical CSS recommendation is dismissed to check that the options does not exist after deactivation of the plugin.
		await test.step( 'Setup clean environment and activate critical CSS module', async () => {
			await boostPrerequisitesBuilder( page ).withCleanEnv( true ).build();
			await testUtils.activateBoostModule( 'critical_css' );
		} );

		await test.step( 'Navigate to Boost settings and verify Critical CSS generation', async () => {
			await admin.visitAdminPage( 'admin.php', 'page=jetpack-boost' );
			await jetpackBoostPage.expectCriticalCssGenerationProgressUIToBeVisible();
			await jetpackBoostPage.expectCriticalCssMetaInfoToBeVisible();
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
			expect( posts.length, 'No jb_store_ posts DB records are found' ).toBe( 0 );

			const options = await executeWpDbQuery(
				'SELECT option_id FROM wp_options WHERE option_name = "jb-critical-css-dismissed-recommendations"',
				[ '--skip-column-names' ]
			);
			expect(
				options.length,
				'jb-critical-css-dismissed-recommendations option is not found in DB'
			).toBe( 0 );
		} );

		// Ensure the plugin is activated again so future tests can run reset commands via withCleanEnv.
		await testUtils.executeWpCommand( 'plugin activate jetpack-boost' );
	} );
} );

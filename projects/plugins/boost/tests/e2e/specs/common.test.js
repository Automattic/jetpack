import { test, expect } from 'jetpack-e2e-commons/fixtures/base-test.js';
import { DashboardPage, PluginsPage, Sidebar } from 'jetpack-e2e-commons/pages/wp-admin/index.js';
import { execWpCommand } from 'jetpack-e2e-commons/helpers/utils-helper.cjs';
import { boostPrerequisitesBuilder } from '../lib/env/prerequisites.js';
import { prerequisitesBuilder } from 'jetpack-e2e-commons/env/prerequisites.js';
import { JetpackBoostPage } from '../lib/pages/index.js';
import playwrightConfig from 'jetpack-e2e-commons/playwright.config.cjs';

test.afterAll( async ( { browser } ) => {
	const page = await browser.newPage( playwrightConfig.use );

	await prerequisitesBuilder( page ).withActivePlugins( [ 'boost' ] ).build();
	await boostPrerequisitesBuilder( page ).withConnection( true ).withGotStarted().build();
	await page.close();
} );

test( 'Click on the plugins page should navigate to Boost settings page', async ( { page } ) => {
	await DashboardPage.visit( page );
	await ( await Sidebar.init( page ) ).selectInstalledPlugins();
	await ( await PluginsPage.init( page ) ).clickOnJetpackBoostSettingsLink();
	expect( await page.url(), "URL should contain 'page=jetpack-boost" ).toContain(
		'page=jetpack-boost'
	);
} );

test( 'Click on the sidebar Boost Jetpack submenu should navigate to Boost settings page', async ( {
	page,
} ) => {
	await DashboardPage.visit( page );
	await ( await Sidebar.init( page ) ).selectJetpackBoost();
	expect( await page.url(), "URL should contain 'page=jetpack-boost" ).toContain(
		'page=jetpack-boost'
	);
} );

test( 'Deactivating the plugin should clear Critical CSS and Dismissed Recommendation notice option', async ( {
	page,
} ) => {
	// Generate Critical CSS to ensure that on plugin deactivation it is cleared.
	// TODO: Also should make sure that a Critical CSS recommendation is dismissed to check that the options does not exist after deactivation of the plugin.
	await boostPrerequisitesBuilder( page )
		.withCleanEnv( true )
		.withGotStarted()
		.withActiveModules( [ 'critical-css' ] )
		.build();
	const jetpackBoostPage = await JetpackBoostPage.visit( page );
	expect(
		await jetpackBoostPage.waitForCriticalCssMetaInfoVisibility(),
		'Critical CSS meta info should be visible'
	).toBeTruthy();
	await DashboardPage.visit( page );
	await ( await Sidebar.init( page ) ).selectInstalledPlugins();
	await ( await PluginsPage.init( page ) ).deactivatePlugin( 'jetpack-boost' );
	let result;
	result = await execWpCommand(
		'db query \'SELECT ID FROM wp_posts WHERE post_type LIKE "%jb_store_%"\' --skip-column-names'
	);
	expect( result.length, 'No DB records are found' ).toBe( 0 );
	result = await execWpCommand(
		'db query \'SELECT option_id FROM wp_options WHERE option_name = "jb-critical-css-dismissed-recommendations"\' --skip-column-names'
	);
	expect( result.length, 'No DB records are found' ).toBe( 0 );
} );

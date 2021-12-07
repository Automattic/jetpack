import { test, expect } from '../fixtures/base-test.js';
import { DashboardPage, PluginsPage, Sidebar } from 'jetpack-e2e-commons/pages/wp-admin/index.js';
import { execWpCommand } from 'jetpack-e2e-commons/helpers/utils-helper.cjs';
import { boostPrerequisitesBuilder } from '../lib/env/prerequisites.js';
import { prerequisitesBuilder } from 'jetpack-e2e-commons/env/prerequisites.js';
import { JetpackBoostPage } from '../lib/pages/index.js';

test.describe( 'Common', () => {
	test.afterAll( async ( { browser } ) => {
		const page = await browser.newPage();

		await prerequisitesBuilder( page ).withActivePlugins( [ 'boost' ] ).build();
		await boostPrerequisitesBuilder( page ).withConnection( true ).build();
	} );

	test( 'Click on the plugins page should navigate to Boost settings page', async ( { page } ) => {
		await DashboardPage.visit( page );
		await ( await Sidebar.init( page ) ).selectInstalledPlugins();
		const pluginsPage = await PluginsPage.init( page );
		const selector = "tr[data-slug='jetpack-boost'] .row-actions a[href*='=jetpack-boost']";
		await pluginsPage.click( selector );
		expect( await page.url() ).toContain( 'page=jetpack-boost' );
	} );

	test( 'Click on the sidebar Boost Jetpack submenu should navigate to Boost settings page', async ( {
		page,
	} ) => {
		await DashboardPage.visit( page );
		await ( await Sidebar.init( page ) ).selectJetpackBoost();
		expect( await page.url() ).toContain( 'page=jetpack-boost' );
	} );

	test( 'Deactivating the plugin should clear Critical CSS and Dismissed Recommendation notice option', async ( {
		page,
	} ) => {
		// Generate Critical CSS to ensure that on plugin deactivation it is cleared.
		// TODO: Also should make sure that a Critical CSS recommendation is dismissed to check that the options does not exist after deactivation of the plugin.
		await boostPrerequisitesBuilder( page ).withActiveModules( [ 'critical-css' ] ).build();
		await JetpackBoostPage.visit( page );
		await expect( await page.locator( '.jb-critical-css__meta' ) ).toBeVisible( {
			timeout: 3 * 60 * 1000,
		} );
		await DashboardPage.visit( page );
		await ( await Sidebar.init( page ) ).selectInstalledPlugins();
		const pluginsPage = await PluginsPage.init( page );
		await pluginsPage.deactivatePlugin( 'jetpack-boost' );
		let result;
		result = await execWpCommand(
			'db query \'SELECT ID FROM wp_posts WHERE post_type LIKE "%jb_store_%"\' --skip-column-names'
		);
		expect( result.length ).toBe( 0 );
		result = await execWpCommand(
			'db query \'SELECT option_id FROM wp_options WHERE option_name = "jb-critical-css-dismissed-recommendations"\' --skip-column-names'
		);
		expect( result.length ).toBe( 0 );
	} );
} );

import {
	Sidebar,
	PluginsPage,
	DashboardPage,
	JetpackPage,
} from 'jetpack-e2e-commons/pages/wp-admin/index.js';
import { execWpCommand } from 'jetpack-e2e-commons/helpers/utils-helper.cjs';
import { prerequisitesBuilder } from 'jetpack-e2e-commons/env/index.js';
import { test, expect } from 'jetpack-e2e-commons/fixtures/base-test.js';
import playwrightConfig from '../../playwright.config.cjs';

test.describe( 'Jetpack pre-connection', () => {
	test.beforeAll( async ( { browser } ) => {
		const page = await browser.newPage( playwrightConfig.use );
		await prerequisitesBuilder( page ).withCleanEnv().withLoggedIn( true ).build();
		await page.close();
	} );

	test.beforeEach( async ( { page } ) => {
		await DashboardPage.visit( page );
	} );

	test( 'Can find connect button on plugins page', async ( { page } ) => {
		await ( await Sidebar.init( page ) ).selectInstalledPlugins();

		const pluginsPage = await PluginsPage.init( page );
		await execWpCommand( 'transient set activated_jetpack true 120' );
		await pluginsPage.reload();

		expect(
			await pluginsPage.isFullScreenPopupShown(),
			'Full screen pop-up should be displayed'
		).toBeTruthy();
	} );

	test( 'Can find connect button on dashboard page', async ( { page } ) => {
		await ( await Sidebar.init( page ) ).selectDashboard();

		const dashboard = await DashboardPage.init( page );
		expect(
			await dashboard.isConnectBannerVisible(),
			'Connect banner should be visible'
		).toBeTruthy();
	} );

	test( 'Can find connect button on Jetpack page', async ( { page } ) => {
		await ( await Sidebar.init( page ) ).selectJetpack();

		const jetpackPage = await JetpackPage.init( page );
		expect(
			await jetpackPage.isConnectScreenVisible(),
			'Connect screen should be visible'
		).toBeTruthy();
	} );
} );

import Sidebar from '../lib/pages/wp-admin/sidebar';
import PluginsPage from '../lib/pages/wp-admin/plugins';
import DashboardPage from '../lib/pages/wp-admin/dashboard';
import JetpackPage from '../lib/pages/wp-admin/jetpack';
import { execWpCommand } from '../lib/utils-helper';
import path from 'path';
import config from 'config';
import { prerequisitesBuilder } from '../lib/env/prerequisites';

/**
 *
 * @group pre-connection
 */
describe( 'Jetpack pre-connection', () => {
	beforeAll( async () => {
		await prerequisitesBuilder().withCleanEnv().build();
	} );

	beforeEach( async () => {
		await DashboardPage.visit( page );
	} );

	afterAll( async () => {
		await execWpCommand(
			`option update jetpack_private_options --format=json < ${ path.resolve(
				config.get( 'temp.jetpackPrivateOptions' )
			) }`
		);
	} );

	it( 'Can find connect button on plugins page', async () => {
		await ( await Sidebar.init( page ) ).selectInstalledPlugins();

		const pluginsPage = await PluginsPage.init( page );
		await execWpCommand( 'transient set activated_jetpack true 120' );
		await pluginsPage.reload();

		expect( await pluginsPage.isFullScreenPopupShown() ).toBeTruthy();
	} );

	it( 'Can find connect button on dashboard page', async () => {
		await ( await Sidebar.init( page ) ).selectDashboard();

		const dashboard = await DashboardPage.init( page );
		expect( await dashboard.isConnectBannerVisible() ).toBeTruthy();
	} );

	it( 'Can find connect button on Jetpack page', async () => {
		await ( await Sidebar.init( page ) ).selectJetpack();

		const jetpackPage = await JetpackPage.init( page );
		expect( await jetpackPage.isConnectBannerVisible() ).toBeTruthy();
	} );
} );

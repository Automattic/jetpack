/**
 * Internal dependencies
 */
import Sidebar from '../lib/pages/wp-admin/sidebar';
import PluginsPage from '../lib/pages/wp-admin/plugins';
import DashboardPage from '../lib/pages/wp-admin/dashboard';
import JetpackPage from '../lib/pages/wp-admin/jetpack';
import { catchBeforeAll } from '../lib/setup-env';
import { execWpCommand } from '../lib/utils-helper';

describe( 'Jetpack pre-connection', () => {
	catchBeforeAll( async () => {
		await execWpCommand( 'wp option delete jetpack_private_options' );
		await page.reload();
	} );

	afterAll( async () => {
		await execWpCommand(
			'wp option update jetpack_private_options --format=json < jetpack_private_options.txt'
		);
	} );

	it( 'Can find connect button on plugins page', async () => {
		await ( await Sidebar.init( page ) ).selectInstalledPlugins();

		const pluginsPage = await PluginsPage.init( page );
		await execWpCommand( 'wp transient set activated_jetpack true 120' );
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

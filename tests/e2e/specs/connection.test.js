/**
 * Internal dependencies
 */
import WPLoginPage from '../lib/pages/wp-admin/login';
import Sidebar from '../lib/pages/wp-admin/sidebar';
import PluginsPage from '../lib/pages/wp-admin/plugins';
import DashboardPage from '../lib/pages/wp-admin/dashboard';
import JetpackPage from '../lib/pages/wp-admin/jetpack';
import { execShellCommand, getNgrokSiteUrl } from '../lib/utils-helper';

jest.setTimeout( 600000 );

async function resetWordpressInstall() {
	await execShellCommand( './tests/e2e/bin/setup-e2e-travis.sh reset_wp' );
}

describe( 'Jetpack connection', () => {
	beforeAll( async () => {
		await resetWordpressInstall();
		const url = getNgrokSiteUrl();
		await ( await WPLoginPage.visit( page, url + '/wp-login.php' ) ).login();
	} );

	it( 'Can find connect button on plugins page', async () => {
		await ( await Sidebar.init( page ) ).selectInstalledPlugins();

		const pluginsPage = await PluginsPage.init( page );
		await pluginsPage.deactivateJetpack();
		await pluginsPage.activateJetpack();

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

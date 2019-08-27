/**
 * Internal dependencies
 */
import WPLoginPage from '../lib/pages/wp-admin/login';
import Sidebar from '../lib/pages/wp-admin/sidebar';
import PluginsPage from '../lib/pages/wp-admin/plugins';
import DashboardPage from '../lib/pages/wp-admin/dashboard';
import JetpackPage from '../lib/pages/wp-admin/jetpack';
/**
 * External dependencies
 */
import { execSyncShellCommand } from '../lib/utils-helper';

jest.setTimeout( 600000 );

function resetWordpressInstall() {
	const cmd = 'bash tests/e2e/bin/setup-e2e-travis.sh reset_wp';

	console.log( 'resetWordpressInstall' );
	const r = execSyncShellCommand( 'pwd' );
	console.log( r );

	const out = execSyncShellCommand( cmd );

	console.log( out );
}

function getNgrokSiteUrl() {
	const cmd =
		'echo $(curl -s localhost:4040/api/tunnels/command_line | jq --raw-output .public_url)';
	console.log( 'getNgrokSiteUrl' );
	const out = execSyncShellCommand( cmd );

	console.log( out );
	return out;
}

beforeAll( async () => {
	resetWordpressInstall();
	const url = getNgrokSiteUrl();
	await ( await WPLoginPage.visit( page, url ) ).login();
} );

describe( 'Jetpack connection', () => {
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

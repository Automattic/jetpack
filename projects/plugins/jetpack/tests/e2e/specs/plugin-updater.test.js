import { doInPlaceConnection } from '../lib/flows/jetpack-connect';
import { execWpCommand, prepareUpdaterTest, execMultipleWpCommands } from '../lib/utils-helper';
import Sidebar from '../lib/pages/wp-admin/sidebar';
import PluginsPage from '../lib/pages/wp-admin/plugins';
import DashboardPage from '../lib/pages/wp-admin/dashboard';
import JetpackPage from '../lib/pages/wp-admin/jetpack';
import { testStep } from '../lib/reporters/reporter';
import { prerequisitesBuilder } from '../lib/env/prerequisites';

/**
 *
 * @group pre-connection
 * @group update
 */
describe( 'Jetpack updater', () => {
	beforeAll( async () => {
		await prerequisitesBuilder().withLoggedIn( true ).withWpComLoggedIn( true ).build();

		await prepareUpdaterTest();

		await execMultipleWpCommands(
			'wp plugin deactivate jetpack-dev',
			'wp option delete jetpack_sync_error_idc',
			'wp plugin install --activate jetpack',
			'wp plugin activate e2e-plugin-updater',
			'wp option set e2e_jetpack_upgrader_update_version 8.8-alpha',
			`wp option set e2e_jetpack_upgrader_plugin_url ${ siteUrl }/wp-content/uploads/jetpack.zip`
		);
	} );

	afterAll( async () => {
		await execWpCommand( 'wp plugin uninstall --deactivate jetpack' );
		await prerequisitesBuilder().withCleanEnv().build();
	} );

	beforeEach( async () => {
		await DashboardPage.visit( page );
	} );

	it( 'Plugin updater', async () => {
		await testStep( 'Can login and navigate to Plugins page', async () => {
			await ( await Sidebar.init( page ) ).selectInstalledPlugins();
			await PluginsPage.init( page );
		} );

		await testStep( 'Can update Jetpack', async () => {
			const pluginsPage = await PluginsPage.init( page );
			const versionBefore = await pluginsPage.getJetpackVersion();
			await pluginsPage.updateJetpack();
			const versionAfter = await pluginsPage.getJetpackVersion();
			expect( versionBefore ).not.toBe( versionAfter );
		} );

		await testStep( 'Can connect Jetpack', async () => {
			await ( await Sidebar.init( page ) ).selectJetpack();
			await doInPlaceConnection();
			const jetpackPage = await JetpackPage.init( page );
			expect( await jetpackPage.isConnected() ).toBeTruthy();
		} );
	} );
} );

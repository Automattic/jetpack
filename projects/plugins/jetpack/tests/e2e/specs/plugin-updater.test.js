import { doInPlaceConnection } from '../lib/flows/jetpack-connect';
import {
	execShellCommand,
	execSyncShellCommand,
	execWpCommand,
	prepareUpdaterTest,
} from '../lib/utils-helper';
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

		await execWpCommand( 'plugin deactivate jetpack' );
		await execShellCommand(
			'pnpx jetpack docker --type e2e --name t1 -v exec -- rm /var/www/html/wp-content/plugins/jetpack'
		);

		await execShellCommand(
			'pnpx jetpack docker --type e2e --name t1 -v exec -- ls -la /var/www/html/wp-content/plugins'
		);

		await prepareUpdaterTest();
		await execWpCommand( 'plugin install --activate jetpack' );
		await execWpCommand( 'plugin activate e2e-plugin-updater' );

		await execShellCommand(
			'pnpx jetpack docker --type e2e --name t1 -v exec -- chown -R www-data:www-data /var/www'
		);

		await execWpCommand( 'option set e2e_jetpack_upgrader_update_version 99.9-alpha' );
		await execWpCommand(
			`option set e2e_jetpack_upgrader_plugin_url ${ siteUrl }/wp-content/uploads/jetpack.zip`
		);
	} );

	afterAll( async () => {
		await execWpCommand( 'plugin uninstall --deactivate jetpack' );
		await execSyncShellCommand(
			'pnpx jetpack docker --type e2e --name t1 -v exec -- ln -s /usr/local/src/jetpack-monorepo/projects/plugins/jetpack/ /var/www/html/wp-content/plugins/jetpack'
		);
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

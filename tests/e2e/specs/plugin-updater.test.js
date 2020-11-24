/**
 * Internal dependencies
 */
import { catchBeforeAll, step } from '../lib/setup-env';
import { connectThroughWPAdminIfNeeded } from '../lib/flows/jetpack-connect';
import {
	execWpCommand,
	prepareUpdaterTest,
	getTunnelSiteUrl,
	resetWordpressInstall,
	execMultipleWpCommands,
} from '../lib/utils-helper';
import Sidebar from '../lib/pages/wp-admin/sidebar';
import PluginsPage from '../lib/pages/wp-admin/plugins';

// Disable pre-connect for this test suite
process.env.SKIP_CONNECT = true;

describe( 'Jetpack updater', () => {
	catchBeforeAll( async () => {
		await prepareUpdaterTest();
		const url = getTunnelSiteUrl();

		await execMultipleWpCommands(
			'wp plugin deactivate jetpack-dev',
			'wp option delete jetpack_sync_error_idc',
			'wp plugin install --activate jetpack',
			'wp plugin activate e2e-plugin-updater',
			'wp option set e2e_jetpack_upgrader_update_version 8.8-alpha',
			`wp option set e2e_jetpack_upgrader_plugin_url ${ url }/wp-content/uploads/jetpack.zip`
		);
	} );

	afterAll( async () => {
		await execWpCommand( 'wp plugin uninstall --deactivate jetpack' );
		await resetWordpressInstall();
	} );

	it( 'Plugin updater', async () => {
		await step( 'Can login and navigate to Plugins page', async () => {
			await ( await Sidebar.init( page ) ).selectInstalledPlugins();
			await PluginsPage.init( page );
		} );

		await step( 'Can update Jetpack', async () => {
			const pluginsPage = await PluginsPage.init( page );
			const versionBefore = await pluginsPage.getJetpackVersion();
			await pluginsPage.updateJetpack();
			const versionAfter = await pluginsPage.getJetpackVersion();
			expect( versionBefore ).not.toBe( versionAfter );
		} );

		await step( 'Can connect Jetpack', async () => {
			await connectThroughWPAdminIfNeeded( { mockPlanData: true, plan: 'free' } );
		} );
	} );
} );

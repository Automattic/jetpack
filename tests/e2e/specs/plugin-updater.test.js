/**
 * Internal dependencies
 */
import { catchBeforeAll, step } from '../lib/setup-env';
import { loginToWpSite, connectThroughWPAdminIfNeeded } from '../lib/flows/jetpack-connect';
import {
	execWpCommand,
	prepareUpdaterTest,
	getNgrokSiteUrl,
	resetWordpressInstall,
} from '../lib/utils-helper';
import Sidebar from '../lib/pages/wp-admin/sidebar';
import PluginsPage from '../lib/pages/wp-admin/plugins';

describe( 'Jetpack updater', () => {
	catchBeforeAll( async () => {
		await prepareUpdaterTest();
		await execWpCommand( 'wp plugin deactivate jetpack-dev' );
		await execWpCommand( 'wp plugin install --activate jetpack' );
		await execWpCommand( 'wp plugin activate e2e-plugin-updater' );
		await execWpCommand( 'wp option set e2e_jetpack_upgrader_update_version 8.8-alpha' );
		const url = getNgrokSiteUrl();
		await execWpCommand(
			`wp option set e2e_jetpack_upgrader_plugin_url ${ url }/wp-content/uploads/jetpack.zip`
		);
	} );

	afterAll( async () => {
		await resetWordpressInstall();
	} );

	it( 'Plugin updater', async () => {
		await step( 'Can login and navigate to Plugins page', async () => {
			await loginToWpSite();
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

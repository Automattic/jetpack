/**
 * Internal dependencies
 */
import { catchBeforeAll, step } from '../lib/setup-env';
import { loginToWpSite, connectThroughWPAdminIfNeeded } from '../lib/flows/jetpack-connect';
import { execWpCommand, resetWordpressInstall, getNgrokSiteUrl } from '../lib/utils-helper';
import Sidebar from '../lib/pages/wp-admin/sidebar';
import PluginsPage from '../lib/pages/wp-admin/plugins';

describe( 'Jetpack updater', () => {
	catchBeforeAll( async () => {
		await resetWordpressInstall();
		await execWpCommand( 'wp plugin --quiet install --activate jetpack' );
		await execWpCommand( 'wp plugin --quiet deactivate jetpack-dev' );
		await execWpCommand( 'wp plugin activate e2e-plugin-updater' );
		await execWpCommand( 'wp option set e2e_jetpack_upgrader_update_version 8.8-alpha' );
		const url = getNgrokSiteUrl();
		await execWpCommand(
			`wp option set e2e_jetpack_upgrader_plugin_url ${ url }/wp-content/jetpack.zip`
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
			console.log( versionBefore, versionAfter );
			expect( versionBefore ).not.toBe( versionAfter );
		} );

		await step( 'Can connect Jetpack', async () => {
			const status = await connectThroughWPAdminIfNeeded( { mockPlanData: true, plan: 'free' } );
		} );
	} );
} );

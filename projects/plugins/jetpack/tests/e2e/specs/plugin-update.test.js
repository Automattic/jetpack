import { test as baseTest, expect } from '../fixtures/base-test.js';
import { doClassicConnection } from 'jetpack-e2e-commons/flows/index.js';
import {
	execShellCommand,
	execSyncShellCommand,
	execWpCommand,
	prepareUpdaterTest,
	resolveSiteUrl,
} from 'jetpack-e2e-commons/helpers/utils-helper.cjs';
import {
	Sidebar,
	PluginsPage,
	DashboardPage,
	JetpackPage,
} from 'jetpack-e2e-commons/pages/wp-admin/index.js';
import { prerequisitesBuilder } from 'jetpack-e2e-commons/env/index.js';

const test = baseTest.extend( {
	page: async ( { page }, use ) => {
		await execShellCommand( '/bin/prepare-jetpack-zip.sh' );

		await prepareUpdaterTest();

		await prerequisitesBuilder( page ).withLoggedIn( true ).withWpComLoggedIn( true ).build();

		await execWpCommand( `plugin activate e2e-plugin-updater` );
		await execWpCommand( `option set e2e_jetpack_upgrader_update_version 99.9-alpha` );
		await execWpCommand(
			`option set e2e_jetpack_upgrader_plugin_url ${ resolveSiteUrl() }/wp-content/uploads/jetpack.99.9.zip`
		);

		await DashboardPage.visit( page );
		await use( page );

		//cleanup
		await execWpCommand( 'plugin uninstall --deactivate jetpack' );
		await execShellCommand(
			'pnpx jetpack docker --type e2e --name t1 -v exec-silent -- rm /var/www/html/wp-content/plugins/jetpack'
		);
		execSyncShellCommand(
			'pnpx jetpack docker --type e2e --name t1 -v exec-silent -- ln -s /usr/local/src/jetpack-monorepo/projects/plugins/jetpack/ /var/www/html/wp-content/plugins/jetpack'
		);
		await prerequisitesBuilder().withCleanEnv().build();
	},
} );

test( 'Update Jetpack plugin', async ( { page } ) => {
	await test.step( 'Can login and navigate to Plugins page', async () => {
		await ( await Sidebar.init( page ) ).selectInstalledPlugins();
		await PluginsPage.init( page );
	} );

	await test.step( 'Can update Jetpack', async () => {
		const pluginsPage = await PluginsPage.init( page );
		// const versionBefore = await pluginsPage.getJetpackVersion();
		await pluginsPage.updateJetpack();
		// const versionAfter = await pluginsPage.getJetpackVersion();
		// expect( versionBefore ).not.toBe( versionAfter );
	} );

	await test.step( 'Can connect Jetpack', async () => {
		await ( await Sidebar.init( page ) ).selectJetpack();
		await doClassicConnection();
		const jetpackPage = await JetpackPage.init( page );
		expect( await jetpackPage.isConnected() ).toBeTruthy();
	} );
} );

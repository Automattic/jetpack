import { test as baseTest, expect } from '../fixtures/base-test.js';
import {
	execShellCommand,
	execSyncShellCommand,
	execWpCommand,
	BASE_DOCKER_CMD,
	resolveSiteUrl,
} from 'jetpack-e2e-commons/helpers/utils-helper.cjs';
import { Sidebar, PluginsPage } from 'jetpack-e2e-commons/pages/wp-admin/index.js';
import { prerequisitesBuilder } from 'jetpack-e2e-commons/env/index.js';

const test = baseTest.extend( {
	page: async ( { page }, use ) => {
		const version = '99.9-alpha';

		// setup
		const cmd = `${ BASE_DOCKER_CMD } -v exec-silent /usr/local/src/jetpack-monorepo/projects/plugins/jetpack/tests/e2e/bin/prepare-plugin-update.sh`;
		await execShellCommand( cmd );
		const updateUrl = `${ resolveSiteUrl() }/wp-content/uploads/jetpack.99.9.zip`;

		await execWpCommand( `plugin install --activate jetpack` );
		await execWpCommand( `plugin activate e2e-plugin-updater` );
		await execWpCommand( `option set e2e_jetpack_upgrader_update_version ${ version }` );
		await execWpCommand( `option set e2e_jetpack_upgrader_plugin_url ${ updateUrl }` );

		await prerequisitesBuilder( page ).withLoggedIn( true ).build();

		// test
		await use( page );

		//cleanup
		if ( ! process.env.UPDATE_TEST_SKIP_CLEANUP ) {
			await execWpCommand( 'plugin uninstall --deactivate jetpack' );
			execSyncShellCommand(
				`${ BASE_DOCKER_CMD } -v exec-silent -- ln -s /usr/local/src/jetpack-monorepo/projects/plugins/jetpack/ /var/www/html/wp-content/plugins/jetpack`
			);
			await prerequisitesBuilder().withCleanEnv().build();
		}
	},
} );

test( 'Update Jetpack plugin', async ( { page } ) => {
	await test.step( 'Can login and navigate to Plugins page', async () => {
		await ( await Sidebar.init( page ) ).selectInstalledPlugins();
		await PluginsPage.init( page );
	} );

	await test.step( 'Can update Jetpack', async () => {
		const pluginsPage = await PluginsPage.init( page );
		const versionBefore = await pluginsPage.getJetpackVersion();
		await pluginsPage.updateJetpack();
		const versionAfter = await pluginsPage.getJetpackVersion();
		expect( versionBefore ).not.toBe( versionAfter );
	} );
} );

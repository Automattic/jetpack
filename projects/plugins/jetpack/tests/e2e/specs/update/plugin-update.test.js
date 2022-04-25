import {
	execShellCommand,
	resolveSiteUrl,
	execContainerShellCommand,
} from 'jetpack-e2e-commons/helpers/utils-helper.cjs';
import { PluginsPage, JetpackDashboardPage } from 'jetpack-e2e-commons/pages/wp-admin/index.js';
import { test, expect } from 'jetpack-e2e-commons/fixtures/base-test.js';
import { prerequisitesBuilder } from 'jetpack-e2e-commons/env/index.js';

test( 'Update Jetpack plugin', async ( { page } ) => {
	const binPath = '/usr/local/src/jetpack-monorepo/projects/plugins/jetpack/tests/e2e/bin/update/';

	// Prepare for update
	await execShellCommand( `./bin/update/prepare-zip.sh` );
	await execContainerShellCommand( `${ binPath }prepare-update.sh ${ resolveSiteUrl() }` );

	// Update
	await prerequisitesBuilder( page ).withLoggedIn( true ).withConnection( true ).build();

	let pluginsPage;

	await test.step( 'Navigate to Plugins page', async () => {
		pluginsPage = await PluginsPage.visit( page );
	} );

	// Capture Jetpack status before update
	await execContainerShellCommand( `${ binPath }pre-update.sh ${ resolveSiteUrl() }` );

	await test.step( 'Can update Jetpack', async () => {
		await pluginsPage.updateJetpack();
	} );

	// Capture Jetpack status after update
	await execContainerShellCommand( `${ binPath }post-update.sh` );

	await test.step( 'Jetpack is still connected', async () => {
		const jetpackPage = await JetpackDashboardPage.visit( page );
		expect( await jetpackPage.isUserConnected(), 'Jetpack should be connected' ).toBeTruthy();
	} );
} );

test.afterEach( async () => {
	if ( ! process.env.SKIP_ENV_CLEAN ) {
		await execShellCommand( `pnpm env:new` );
	}
} );

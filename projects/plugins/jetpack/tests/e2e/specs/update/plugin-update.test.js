import {
	execShellCommand,
	resolveSiteUrl,
	execContainerShellCommand,
} from 'jetpack-e2e-commons/helpers/utils-helper.cjs';
import { PluginsPage } from 'jetpack-e2e-commons/pages/wp-admin/index.js';
import { test } from '../../fixtures/base-test.js';
import { prerequisitesBuilder } from 'jetpack-e2e-commons/env/index.js';

test( 'Update Jetpack plugin', async ( { page } ) => {
	const binPath = '/usr/local/src/jetpack-monorepo/projects/plugins/jetpack/tests/e2e/bin/update/';

	// Prepare for update
	await execShellCommand( `./bin/update/prepare-zip.sh` );
	await execContainerShellCommand( `${ binPath }pre-update.sh ${ resolveSiteUrl() }` );

	// Update
	await prerequisitesBuilder( page ).withLoggedIn( true ).build();

	// Check if zip is present - DELETE ME LATER
	await execContainerShellCommand( `ls /var/www/html/wp-content/uploads` );

	let pluginsPage;

	await test.step( 'Navigate to Plugins page', async () => {
		pluginsPage = await PluginsPage.visit( page );
	} );

	await test.step( 'Can update Jetpack', async () => {
		await pluginsPage.updateJetpack();
	} );

	// Check Jetpack status after update
	await execContainerShellCommand( `${ binPath }post-update.sh` );
} );

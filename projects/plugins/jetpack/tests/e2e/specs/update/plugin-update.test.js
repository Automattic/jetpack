import {
	execShellCommand,
	resolveSiteUrl,
	BASE_DOCKER_CMD,
} from 'jetpack-e2e-commons/helpers/utils-helper.cjs';
import { PluginsPage } from 'jetpack-e2e-commons/pages/wp-admin/index.js';
import { test } from '../../fixtures/base-test.js';
import { prerequisitesBuilder } from 'jetpack-e2e-commons/env/index.js';

test( 'Update Jetpack plugin', async ( { page } ) => {
	const binPath = '/usr/local/src/jetpack-monorepo/projects/plugins/jetpack/tests/e2e/bin/update/';

	// Prepare for update
	await execShellCommand( `./bin/update/prepare-zip.sh` );
	await execShellCommand(
		`${ BASE_DOCKER_CMD } -v exec-silent ${ binPath }pre-update.sh ${ resolveSiteUrl() }`
	);

	// Update
	await prerequisitesBuilder( page ).withLoggedIn( true ).build();

	let pluginsPage;

	await test.step( 'Navigate to Plugins page', async () => {
		pluginsPage = await PluginsPage.visit( page );
	} );

	await test.step( 'Can update Jetpack', async () => {
		await pluginsPage.updateJetpack();
	} );

	// Check Jetpack status after update
	await execShellCommand( `${ BASE_DOCKER_CMD } -v exec-silent ${ binPath }post-update.sh` );
} );

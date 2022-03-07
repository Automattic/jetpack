import {
	execShellCommand,
	resolveSiteUrl,
	execContainerShellCommand,
} from 'jetpack-e2e-commons/helpers/utils-helper.cjs';
import { PluginsPage, JetpackPage } from 'jetpack-e2e-commons/pages/wp-admin/index.js';
import { test, expect } from '../../fixtures/base-test.js';
import { prerequisitesBuilder } from 'jetpack-e2e-commons/env/index.js';
import logger from 'jetpack-e2e-commons/logger.cjs';
const binPath = '/usr/local/src/jetpack-monorepo/projects/plugins/jetpack/tests/e2e/bin/update/';
let pluginsPage;

test( 'Update Jetpack plugin', async ( { page } ) => {
	// Prepare for update
	await execShellCommand( `./bin/update/prepare-zip.sh` );
	await execContainerShellCommand( `${ binPath }prepare-update.sh ${ resolveSiteUrl() }` );

	// Configure site before update
	await prerequisitesBuilder( page ).withLoggedIn( true ).withConnection( true ).build();

	// Update
	await updateJetpack( page, 'Update Jetpack from stable to current' );
	await updateJetpack( page, 'Update Jetpack from current to next' );
} );

test.afterEach( async () => {
	if ( ! process.env.SKIP_ENV_CLEAN ) {
		await execShellCommand( `pnpm env:new` );
	}
} );

async function updateJetpack( page, stepDescription ) {
	// Capture Jetpack status before update
	await execContainerShellCommand( `${ binPath }pre-update.sh ${ resolveSiteUrl() }` );

	await test.step( 'Navigate to Plugins page', async () => {
		pluginsPage = await PluginsPage.visit( page );

		// Dismiss any banners blocking the view
		try {
			const buttons = page.$$( 'text=Dismiss' );
			for ( const btn of buttons ) {
				btn.click();
			}
		} catch ( e ) {
			logger.debug( 'No banners found to dismiss or some error occurred.' );
		}
	} );

	await test.step( stepDescription, async () => {
		await pluginsPage.updateJetpack();
	} );

	// Capture Jetpack status after update
	await execContainerShellCommand( `${ binPath }post-update.sh` );

	// Check status after update
	await test.step( 'Jetpack is still connected', async () => {
		const jetpackPage = await JetpackPage.visit( page );
		expect( await jetpackPage.isConnected() ).toBeTruthy();
	} );
}

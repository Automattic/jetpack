import { prerequisitesBuilder } from '_jetpack-e2e-commons/env/prerequisites.js';
import { expect, test } from '_jetpack-e2e-commons/fixtures/base-test.js';
import logger from '_jetpack-e2e-commons/logger.js';

test.describe( 'Jetpack Protect plugin', () => {
	test.beforeEach( async ( { page } ) => {
		await prerequisitesBuilder( page )
			.withCleanEnv()
			.withActivePlugins( [ 'protect' ] )
			.withLoggedIn( true )
			.build();
	} );

	test( 'Jetpack Protect admin page', async ( { page, admin } ) => {
		logger.action( 'Visit the Jetpack Protect admin page and start for free' );

		await admin.visitAdminPage( 'admin.php', 'page=jetpack-protect' );

		logger.action( 'Checking for button "Get Jetpack Protect"' );
		const getJetpackProtectButton = page.getByRole( 'button', { name: 'Get Jetpack Protect' } );
		await expect( getJetpackProtectButton ).toBeVisible();
		await expect( getJetpackProtectButton ).toBeEnabled();

		logger.action( 'Checking for button "Start for free"' );
		const startForFreeButton = page.getByRole( 'button', { name: 'Start for free' } );
		await expect( startForFreeButton ).toBeVisible();
		await expect( startForFreeButton ).toBeEnabled();

		logger.action( 'Click the start for free button' );
		await startForFreeButton.click();

		logger.action( 'Checking for heading "Stay one step ahead of threats"' );
		await expect(
			page.getByRole( 'heading', { name: 'Stay one step ahead of threats' } )
		).toBeVisible();
	} );
} );

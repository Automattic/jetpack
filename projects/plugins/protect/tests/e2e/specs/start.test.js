import { prerequisitesBuilder } from '_jetpack-e2e-commons/env/prerequisites.js';
import { expect, test } from '_jetpack-e2e-commons/fixtures/base-test.js';
import logger from '_jetpack-e2e-commons/logger.js';

test.describe( 'Jetpack Protect plugin', () => {
	test.beforeEach( async ( { page } ) => {
		await prerequisitesBuilder( page )
			.withCleanEnv()
			.withActivePlugins( [ 'protect' ] )
			.withLoggedIn( true )
			.withConnection( true )
			.build();
	} );

	test( 'Jetpack Protect admin page', async ( { page, admin } ) => {
		logger.action( 'Visit the Jetpack Protect admin page' );

		await admin.visitAdminPage( 'admin.php', 'page=jetpack-protect' );

		logger.action( 'Checking for heading "Don\'t worry about a thing"' );
		await expect(
			page.getByRole( 'heading', { name: "Don't worry about a thing" } )
		).toBeVisible();
	} );
} );

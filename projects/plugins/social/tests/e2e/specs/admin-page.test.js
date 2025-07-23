import { prerequisitesBuilder } from '_jetpack-e2e-commons/env/prerequisites.js';
import { expect, test } from '_jetpack-e2e-commons/fixtures/base-test.ts';
import logger from '_jetpack-e2e-commons/logger.js';
import { disconnect } from '_jetpack-e2e-commons/utils/index.ts';

test.beforeEach( async ( { page, requestUtils } ) => {
	await disconnect( requestUtils );

	await prerequisitesBuilder( page ).withActivePlugins( [ 'jetpack-social' ] ).build();
} );

test( 'Jetpack Social admin page', async ( { page, admin } ) => {
	logger.action( 'Visit the Jetpack Social admin page' );

	await admin.visitAdminPage( 'admin.php', 'page=jetpack-social' );

	logger.action( 'Checking for heading "Jetpack Social"' );
	await expect( page.getByRole( 'heading', { name: 'Jetpack Social' } ) ).toBeVisible();

	logger.action( 'Checking for button "Get Started"' );
	await expect( page.getByRole( 'button', { name: 'Get Started' } ) ).toBeVisible();
} );

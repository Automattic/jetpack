import { prerequisitesBuilder } from 'jetpack-e2e-commons/env/prerequisites.js';
import { expect, test } from 'jetpack-e2e-commons/fixtures/base-test.js';
import logger from 'jetpack-e2e-commons/logger.js';
import { JetpackSocialPage } from '../pages/index.js';

test.beforeEach( async ( { page } ) => {
	await prerequisitesBuilder( page )
		.withCleanEnv()
		.withActivePlugins( [ 'social' ] )
		.withLoggedIn( true )
		.build();
} );

test( 'Jetpack Social admin page', async ( { page } ) => {
	logger.action( 'Visit the Jetpack Social admin page' );
	await JetpackSocialPage.visit( page );

	logger.action( 'Checking for heading "Jetpack Social"' );
	await expect( page.getByRole( 'heading', { name: 'Jetpack Social' } ) ).toBeVisible();

	logger.action( 'Checking for button "Get Started"' );
	await expect( page.getByRole( 'button', { name: 'Get Started' } ) ).toBeVisible();
} );

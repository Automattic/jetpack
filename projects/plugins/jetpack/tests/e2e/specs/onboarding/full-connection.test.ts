import { prerequisitesBuilder } from '_jetpack-e2e-commons/env/index.js';
import { test, expect } from '_jetpack-e2e-commons/fixtures/base-test.js';
import { Onboarding } from '_jetpack-e2e-commons/flows/onboarding.ts';
import logger from '_jetpack-e2e-commons/logger.js';

test.beforeEach( async ( { page } ) => {
	await prerequisitesBuilder( page )
		.withCleanEnv()
		.withLoggedIn( true )
		.withWpComLoggedIn( true )
		.build();
} );

test( 'Full connection - Site and User', async ( { page, requestUtils, admin } ) => {
	const onboarding = new Onboarding( page );

	await test.step( 'Goto My Jetpack', async () => {
		await admin.visitAdminPage( 'admin.php', 'page=my-jetpack' );

		await expect( page, {
			message: 'Should be redirected to the onboarding page',
		} ).toHaveURL( url => url.searchParams.get( 'step' ) === 'onboarding' );
	} );

	await test.step( 'Complete onboarding', async () => {
		await onboarding.onboardUser( requestUtils.baseURL );
	} );

	await test.step( 'Onboarding tour', async () => {
		// For some reason, E2E test sites do not have the onboarding tour param after redirect
		// to My Jetpack page. So we are adding it manually to test the onboarding tour.
		await admin.visitAdminPage( 'admin.php', 'page=my-jetpack&from=jetpack-onboarding' );

		logger.info( 'Navigate through the onboarding tour.' );

		const dialog = page.getByRole( 'dialog', { name: 'Welcome to Jetpack' } );

		await expect( dialog, { message: 'Should have the onboarding dialog' } ).toBeVisible();

		await expect( dialog.getByRole( 'button', { name: 'Close' } ), {
			message: 'Should have the close button',
		} ).toBeVisible();

		const tourSlides = [
			'Simple, yet powerful stats',
			'Making your site super fast',
			'Your site goes wherever you go',
		];

		for ( const heading of tourSlides ) {
			await expect( dialog.getByRole( 'heading', { level: 1, name: heading } ), {
				message: `Should have the heading "${ heading }"`,
			} ).toBeVisible();

			const nextButton = dialog.getByRole( 'button', { name: 'Next', exact: true } );

			// eslint-disable-next-line playwright/no-conditional-in-test
			if ( await nextButton.isVisible() ) {
				await nextButton.click();
			}
		}

		await onboarding.closeOnboardingTour();
	} );

	await test.step( 'Verify site and user connection', async () => {
		// Find a block which has h2 with text "Connection"
		const h2 = page.getByRole( 'heading', { level: 2, name: 'Connection' } );
		const connectionBlock = h2.locator( 'xpath=..' ); // immediate parent

		await expect( connectionBlock, {
			message: 'Should have the text saying the site is connected.',
		} ).toContainText( 'Site connected.' );

		await expect( connectionBlock, {
			message: 'Should have the text showing user connection.',
		} ).toContainText( /Connected as .+ \(Owner\)/ );

		await expect( connectionBlock.getByRole( 'button', { name: 'Manage' } ), {
			message: 'Should have the "Manage" button.',
		} ).toBeVisible();
	} );
} );

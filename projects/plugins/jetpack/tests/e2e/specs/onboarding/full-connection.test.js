import { prerequisitesBuilder } from '_jetpack-e2e-commons/env/index.js';
import { test, expect } from '_jetpack-e2e-commons/fixtures/base-test.js';
import logger from '_jetpack-e2e-commons/logger.js';

test.beforeEach( async ( { page } ) => {
	await prerequisitesBuilder( page )
		.withCleanEnv()
		.withLoggedIn( true )
		.withWpComLoggedIn( true )
		.build();
} );

test( 'Full connection - Site and User', async ( { page, requestUtils, admin } ) => {
	await test.step( 'Goto My Jetpack', async () => {
		await admin.visitAdminPage( 'admin.php', 'page=my-jetpack' );

		await expect( page, {
			message: 'Should be redirected to the onboarding page',
		} ).toHaveURL( url => url.searchParams.get( 'step' ) === 'onboarding' );
	} );

	await test.step( 'Connect', async () => {
		const waitForWpcomAuthPage = page.waitForURL(
			'https://wordpress.com/jetpack/connect/authorize**'
		);

		logger.action( 'Click on the CTA and wait for redirect to WPCOM' );
		await page.getByRole( 'button', { name: 'Supercharge my site' } ).click();
		await waitForWpcomAuthPage;

		const waitForMyJetpackPage = page.waitForURL( url => {
			return (
				url.origin === requestUtils.baseURL &&
				url.pathname.includes( 'wp-admin/admin.php' ) &&
				url.searchParams.get( 'page' ) === 'my-jetpack'
			);
		} );

		logger.action( 'Click on "Approve" button and wait for redirect to My Jetpack' );
		await page.getByRole( 'button', { name: 'Approve', exact: true } ).click();
		await waitForMyJetpackPage;
	} );

	await test.step( 'Onboarding tour', async () => {
		// For some reason, E2E test sites do not have the onboarding tour param after redirect
		// to My Jetpack page. So we are adding it manually to test the onboarding tour.
		await admin.visitAdminPage( 'admin.php', 'page=my-jetpack&from=jetpack-onboarding' );

		logger.action( 'Navigate thourgh the onboardign tour.' );

		const dialog = page.getByRole( 'dialog', { name: 'Welcome to Jetpack' } );

		await expect( dialog, { message: 'Should have the onboarding dialog' } ).toBeVisible();

		await expect( page.getByRole( 'button', { name: 'Close' } ), {
			message: 'Should have the close button',
		} ).toBeVisible();

		const tourSlides = [
			[ 'stats', 'Simple, yet powerful stats' ],
			[ 'speed', 'Making your site super fast' ],
			[ 'app', 'Your site goes wherever you go' ],
		];

		for ( const [ id, heading ] of tourSlides ) {
			await expect( dialog.getByRole( 'heading', { level: 1, name: heading } ), {
				message: `Should have the heading "${ heading }"`,
			} ).toBeVisible();

			// eslint-disable-next-line playwright/no-conditional-in-test
			const name = id === 'app' ? 'Done' : 'Next';

			await dialog.getByRole( 'button', { name, exact: true } ).click();
		}
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

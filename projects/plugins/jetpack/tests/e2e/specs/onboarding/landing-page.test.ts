import { prerequisitesBuilder } from '_jetpack-e2e-commons/env/index.js';
import { expect, test } from '_jetpack-e2e-commons/fixtures/base-test.js';
import { Onboarding } from '_jetpack-e2e-commons/flows/onboarding.ts';

test.beforeEach( async ( { page, admin } ) => {
	await prerequisitesBuilder( page ).withCleanEnv().withLoggedIn( true ).build();

	await admin.visitAdminPage( 'admin.php', 'page=my-jetpack' );
} );

test( 'Onboarding landing page', async ( { page } ) => {
	const onboarding = new Onboarding( page );

	await test.step( 'is full-screen', async () => {
		await expect( page.getByRole( 'navigation', { name: 'Main menu' } ), {
			message: 'Admin main menu should not be visible',
		} ).toBeHidden();

		await expect( page.getByRole( 'navigation', { name: 'Toolbar' } ), {
			message: 'Admin bar at the top should not be visible',
		} ).toBeHidden();
	} );

	await test.step( 'has heading and CTA', async () => {
		await expect(
			page.getByRole( 'heading', {
				level: 1,
				name: 'Start with Jetpack for free',
			} ),
			{
				message: 'Should have the heading',
			}
		).toBeVisible();

		const cta = page.getByRole( 'button', { name: 'Supercharge my site' } );
		await expect( cta, { message: 'Should have the CTA visible' } ).toBeVisible();
		await expect( cta, { message: 'Should have the CTA clickable' } ).toBeEnabled();
	} );

	await test.step( 'has terms of service', async () => {
		const termsOfService = page.locator( 'p', { hasText: 'you agree to our Terms of Service' } );

		const tncLink = termsOfService.getByRole( 'link', { name: 'Terms of Service' } );

		await expect( tncLink, { message: 'Should have the T&C link' } ).toBeVisible();

		await expect( tncLink, {
			message: 'T&C link should point to the correct URL',
		} ).toHaveAttribute( 'href', 'https://jetpack.com/redirect/?source=wpcom-tos' );

		await expect( termsOfService.getByRole( 'link', { name: 'sync your site‘s data' } ), {
			message: 'Should have the link to Jetpack Sync',
		} ).toBeVisible();
	} );

	await test.step( 'CTA should trigger the connection', async () => {
		await onboarding.start();

		await expect( onboarding.CTA, { message: 'CTA should be disabled' } ).toBeDisabled();
		await expect( onboarding.CTA ).toHaveAttribute( 'aria-busy', 'true' );
	} );
} );

import { expect, Admin } from '@automattic/_jetpack-e2e-commons/fixtures/base-test';
import logger from '@automattic/_jetpack-e2e-commons/logger';
import type { Page } from '@playwright/test';

/**
 * Connect Jetpack Protect
 * @param {Page}  page  - Playwright page object
 * @param {Admin} admin - e2e-utils admin object
 */
export async function connect( page: Page, admin: Admin ) {
	logger.debug( 'Connect Jetpack Protect' );

	await admin.visitAdminPage( 'admin.php', 'page=jetpack-protect' );

	const getJetpackProtectButton = page.getByRole( 'button', { name: 'Get Jetpack Protect' } );
	await expect(
		getJetpackProtectButton,
		'"Get Jetpack Protect" button should be visible'
	).toBeVisible();
	await expect(
		getJetpackProtectButton,
		'"Get Jetpack Protect" button should be enabled'
	).toBeEnabled();

	const startForFreeButton = page.getByRole( 'button', { name: 'Start for free' } );
	await expect( startForFreeButton, '"Start for free" button should be visible' ).toBeVisible();
	await expect( startForFreeButton, '"Start for free" button should be enabled' ).toBeEnabled();

	await startForFreeButton.click();

	await expect(
		page.getByText( 'vulnerabilities found' ).or( page.getByText( 'ready soon' ) ),
		'"Vulnerabilities found" or "ready soon" message should be visible'
	).toBeVisible( {
		timeout: 30_000,
	} );
}

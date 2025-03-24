import { expect } from '_jetpack-e2e-commons/fixtures/base-test.js';
import logger from '_jetpack-e2e-commons/logger.js';

/**
 * Connect Jetpack Protect
 * @param {page}  page  - Playwright page object
 * @param {admin} admin - Playwright admin object
 */
export async function connect( page, admin ) {
	logger.step( 'Connect Jetpack Protect' );

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

	await expect(
		page.getByText( 'vulnerabilities found' ).or( page.getByText( 'ready soon' ) )
	).toBeVisible( {
		timeout: 30_000,
	} );
}

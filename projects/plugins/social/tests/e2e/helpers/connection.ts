import { expect, Page } from '@playwright/test';
import logger from '_jetpack-e2e-commons/logger.js';

/**
 * Connect Jetpack Social
 * @param {Page}    page    - Playwright page object
 * @param {boolean} premium - If true, selects the Social premium plan and proceeds with purchase steps; if false, selects the free plan.
 */
export async function connect( page: Page, premium: boolean = false ) {
	logger.debug( 'Connect Jetpack Social' );

	await page.goto( '/wp-admin/admin.php?page=jetpack-social' );
	await page.getByRole( 'button', { name: 'Get Started' } ).click();

	await expect( page.locator( 'button > svg.components-spinner' ) ).toBeHidden( {
		timeout: 40000,
	} );

	await page.getByRole( 'button', { name: 'Approve' } ).click();

	if ( premium ) {
		logger.debug( 'Selecting Social premium plan' );
		await page.getByRole( 'link', { name: 'Get Social' } ).click();
		// todo add purchase steps
	} else {
		logger.debug( 'Selecting free plan' );
		await page.getByRole( 'button', { name: 'Start for free' } ).click();
	}
}

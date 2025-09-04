import { expect } from '@playwright/test';
import logger from '_jetpack-e2e-commons/logger';
import type { Page } from '@playwright/test';

export default class JetpackBoostPage {
	page: Page;

	constructor( page: Page ) {
		this.page = page;
	}

	/**
	 * Visit the Jetpack Boost page in the WordPress admin.
	 */
	async visit() {
		await this.page.goto( '/wp-admin/admin.php?page=jetpack-boost' );
	}

	/**
	 * Connection flow.
	 */
	async connect() {
		await this.chooseFreePlan();
		await this.expectScoreToBeLoading();
	}

	/**
	 * Select the free plan from getting started page.
	 */
	async chooseFreePlan() {
		const button = this.page.getByRole( 'button', { name: 'Start for free' } );

		const connectionResponse = this.page.waitForResponse(
			response => response.url().includes( '/jetpack-boost/v1/connection' ),
			{ timeout: 60 * 1000 }
		);
		await button.click();
		await connectionResponse;

		await expect(
			this.page.getByRole( 'button', { name: 'Refresh' } ),
			'Refresh button should be visible after connection'
		).toBeVisible();
	}

	/**
	 * Toggle a module and wait for the success notice to appear.
	 *
	 * @param {string}  moduleName     - The name of the module to toggle. It should match the data-testid attribute of the module's checkbox.
	 * @param {boolean} targetState    - The target state of the module. The function will check if the module is currently in the opposite state first and fail if not.
	 * @param           checkForNotice - Whether to check for the success notice after toggling the module. Defaults to true.
	 */
	async toggleModule( moduleName: string, targetState: boolean, checkForNotice = true ) {
		logger.debug( `toggleModule > ${ moduleName } > ${ targetState ? 'on' : 'off' }` );

		const checkbox = this.page.getByTestId( `module-${ moduleName }` ).getByRole( 'checkbox' );

		await expect(
			checkbox,
			`Checkbox for ${ moduleName } should be ${
				targetState ? 'unchecked' : 'checked'
			} before toggling`
		).toBeChecked( { checked: ! targetState } );

		await checkbox.click();

		await expect(
			checkbox,
			`Checkbox for ${ moduleName } should be ${
				targetState ? 'checked' : 'unchecked'
			} before toggling`
		).toBeChecked( { checked: targetState } );

		if ( checkForNotice ) {
			// Wait for the success notice to appear after toggling the module
			this.expectNoticeToBeVisible( `Module ${ targetState ? 'activated' : 'deactivated' }` );
		}
	}

	/**
	 * Returns the score for a specific platform.
	 * @param  platform - The platform to get the score for, either 'desktop' or 'mobile'.
	 * @return {Promise<number>} - The score for the specified platform.
	 */
	async getSpeedScore( platform: string ): Promise< number > {
		const parent = `div.jb-score-bar--${ platform }  .jb-score-bar__filler`;

		const score = this.page.locator( parent + ' .jb-score-bar__score' );
		await score.waitFor( {
			state: 'visible',
			timeout: 80 * 1000,
		} );

		return Number( await score.textContent() );
	}

	/**
	 * Expects the overall score header and speed scores to be visible and valid.
	 * Waits for both mobile and desktop scores to be greater than 0.
	 */
	async expectScoreToBeVisible() {
		await expect(
			this.page.getByRole( 'heading', { name: /Overall Score: [A-Z]/i } ),
			'Overall score heading should be visible'
		).toBeVisible( { timeout: 60 * 1000 } ); // Wait up to 60 seconds for the overall score heading to be visible
		await expect( async () => {
			const mobileScore = await this.getSpeedScore( 'mobile' );
			expect( mobileScore, 'Mobile score should be greater than 0' ).toBeGreaterThan( 0 );
		} ).toPass();
		await expect( async () => {
			const desktopScore = await this.getSpeedScore( 'desktop' );
			expect( desktopScore, 'Desktop score should be greater than 0' ).toBeGreaterThan( 0 );
		} ).toPass();
	}

	/**
	 * Expects the loading state of the score to be visible.
	 */
	async expectScoreToBeLoading() {
		await expect(
			this.page.getByRole( 'heading', { name: 'Loading…' } ),
			'Loading… heading should be visible'
		).toBeVisible();
		await expect(
			this.page.getByRole( 'heading', { name: /Overall Score: [A-Z]/i } ),
			'Overall score heading should not be visible'
		).toBeHidden();
	}

	/**
	 * Waits for a notice to appear and checks its visibility.
	 * @param {string|RegExp} message - The message to wait for.
	 */
	async expectNoticeToBeVisible( message: string | RegExp ) {
		await expect(
			this.page.getByTestId( 'snackbar' ).getByText( message ),
			`Should show ${ message } notice`
		).toBeVisible( { timeout: 30 * 1000 } );
	}

	// Cornerstone Pages

	async getCornerstonePagesTextarea() {
		return this.page.locator( '#jb-cornerstone-pages' );
	}

	/**
	 * Opens the Cornerstone Pages panel if not already open and checks if it is visible.
	 */
	async openCornerstonePagesPanel() {
		const panelToggle = this.page.getByRole( 'button', { name: 'Cornerstone Pages' } ).first();
		const panelContent = this.page.getByText( 'List the most important pages' );
		if ( ! ( await panelContent.isVisible() ) ) {
			await panelToggle.click();
			await expect( panelContent, 'Panel content should be visible' ).toBeVisible();
		}
	}

	/**
	 * Enters the provided URL into the Cornerstone Pages input field.
	 * @param url - The URL to enter in the Cornerstone Pages input field.
	 */
	async enterCornerstonePageUrl( url: string ) {
		( await this.getCornerstonePagesTextarea() ).clear();
		await ( await this.getCornerstonePagesTextarea() ).fill( url );
	}

	/**
	 * Enters the URL into the Cornerstone Pages input field and clicks the Save button.
	 * It also waits for a success notice to appear indicating that the cornerstone pages have been saved
	 * @param url - The URL to add as a cornerstone page.
	 */
	async addCornerstonePage( url: string ) {
		await this.enterCornerstonePageUrl( url );
		await this.page.getByRole( 'button', { name: 'Save' } ).first().click();
		await this.expectNoticeToBeVisible( 'Cornerstone pages saved' );
	}

	/**
	 * Toggles the prerender option for Cornerstone Pages.
	 * @param {boolean} enabled - Whether to enable or disable prerendering.
	 */
	async togglePrerenderOption( enabled: boolean ) {
		const toggle = this.page.locator( '[data-testid="prerender-cornerstone-pages-title"] input' );
		const isCurrentlyChecked = await toggle.isChecked();

		if ( isCurrentlyChecked !== enabled ) {
			await toggle.click();
		}
		await this.expectNoticeToBeVisible( `Prerender ${ enabled ? 'enabled' : 'disabled' }` );
	}
}

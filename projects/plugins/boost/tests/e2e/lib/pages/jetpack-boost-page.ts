import logger from '@automattic/_jetpack-e2e-commons/logger';
import { expect } from '@playwright/test';
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
			{ timeout: 60000 }
		);
		await button.click();
		await connectionResponse;

		await expect(
			this.page.getByRole( 'button', { name: 'Refresh' } ),
			'Refresh button should be visible after connection'
		).toBeVisible( { timeout: 40000 } );
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
			await this.expectNoticeToBeVisible( `Module ${ targetState ? 'activated' : 'deactivated' }` );
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
			timeout: 80000,
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
		).toBeVisible( { timeout: 60000 } ); // Wait up to 60 seconds for the overall score heading to be visible
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
	 * Waits for Critical CSS generation to reach a terminal state by intercepting the
	 * DataSync poll for `critical_css_state` (exposed at the hyphenated REST route
	 * `/jetpack-boost-ds/critical-css-state`). Resolves once the aggregate status
	 * becomes `generated`, and throws if it becomes `error` — an `error` state renders
	 * the show-stopper UI rather than the `critical-css-meta` element callers assert
	 * on, so surfacing it as an explicit failure beats a downstream "element not
	 * visible" timeout.
	 *
	 * The backend only flips the aggregate status away from `pending` once every
	 * provider has finished (see `Critical_CSS_State::maybe_set_generated()`), so a
	 * single matching response is a safe completion signal — there is no need to count
	 * the per-provider saves that generation fans out into.
	 *
	 * `page.waitForResponse()` only matches responses that arrive after it is called,
	 * so create this promise *before* the action that triggers generation. For a
	 * Regenerate flow where the page already shows previously-generated CSS, gate on
	 * the `request-regenerate` action first (it flips the server state to `pending`,
	 * see `Regenerate::start()`) so this wait cannot resolve on the stale `generated`
	 * poll.
	 *
	 * The status literals (`generated`/`error`) and the route are kept in sync with
	 * `Critical_CSS_State` and the DataSync registry.
	 *
	 * @param {number} timeout - Maximum time to wait in milliseconds.
	 * @return {Promise<void>} Resolves once generation reaches `generated`.
	 */
	async waitForCriticalCssGeneration( timeout = 60000 ) {
		let terminalStatus: string | undefined;

		await this.page.waitForResponse(
			async response => {
				if (
					! response.url().includes( '/jetpack-boost-ds/critical-css-state' ) ||
					response.request().method() !== 'GET' ||
					! response.ok()
				) {
					return false;
				}
				try {
					/*
					 * DataSync wraps the value in a { status: 'success', JSON: <state> }
					 * envelope, so the real Critical CSS status lives at body.JSON.status,
					 * not the top-level body.status (which is always 'success').
					 */
					const body = ( await response.json() ) as { JSON?: { status?: string } };
					const status = body?.JSON?.status;
					if ( status === 'generated' || status === 'error' ) {
						terminalStatus = status;
						return true;
					}
					return false;
				} catch ( error ) {
					logger.error(
						`waitForCriticalCssGeneration: failed to parse critical-css-state response: ${ error }`
					);
					return false;
				}
			},
			{ timeout }
		);

		if ( terminalStatus === 'error' ) {
			throw new Error(
				'Critical CSS generation reached the terminal "error" state instead of "generated".'
			);
		}
	}

	/**
	 * Waits for the client to send the speed score refresh request.
	 * Use when the test asserts that the client initiated a refresh — for example,
	 * to verify that a debounce timer has fired. Decouples from backend latency and
	 * does not match error responses.
	 *
	 * @param {number} timeout - Maximum time to wait in milliseconds.
	 * @return {Promise<import('@playwright/test').Request>} The request sent to the speed score refresh endpoint.
	 */
	async waitForScoreRefreshRequest( timeout = 10000 ) {
		return this.page.waitForRequest(
			request =>
				request.url().includes( '/jetpack-boost/v1/speed-scores/refresh' ) &&
				request.method() === 'POST',
			{ timeout }
		);
	}

	/**
	 * Waits for a successful response from the speed score refresh endpoint.
	 * Use when the test depends on the refresh having completed — for example,
	 * before re-asserting score visibility after clicking Refresh.
	 *
	 * @param {number} timeout - Maximum time to wait in milliseconds.
	 * @return {Promise<import('@playwright/test').Response>} The response from the speed score refresh endpoint.
	 */
	async waitForScoreRefreshResponse( timeout = 10000 ) {
		return this.page.waitForResponse(
			response =>
				response.url().includes( '/jetpack-boost/v1/speed-scores/refresh' ) &&
				response.request().method() === 'POST' &&
				response.ok(),
			{ timeout }
		);
	}

	/**
	 * Waits for a notice to appear and checks its visibility.
	 * @param {string|RegExp} message - The message to wait for.
	 */
	async expectNoticeToBeVisible( message: string | RegExp ) {
		await expect(
			this.page.getByTestId( 'snackbar' ).getByText( message ),
			`Should show ${ message } notice`
		).toBeVisible( { timeout: 30000 } );
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

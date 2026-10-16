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
	 * Select the free plan from getting started page.
	 */
	async chooseFreePlan() {
		const button = this.page.getByRole( 'button', { name: 'Start for free', exact: true } );

		const connectionResponse = this.page.waitForResponse(
			response => response.url().includes( '/jetpack-boost/v1/connection' ),
			{ timeout: 60000 }
		);
		await button.click();
		await connectionResponse;

		await expect(
			this.page.getByRole( 'heading', { name: 'Optimize your speed' } ),
			'Settings should be shown after connection'
		).toBeInViewport( { timeout: 40000 } );
	}

	/**
	 * Returns a module's own toggle. Rows also contain their settings' toggles, such as Page Cache logging.
	 * @param moduleName - The module slug, as used in the row's data-testid.
	 * @return The checkbox locator.
	 */
	getModuleToggle( moduleName: string ) {
		return this.page.getByTestId( `module-${ moduleName }` ).getByRole( 'checkbox' ).first();
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

		const checkbox = this.getModuleToggle( moduleName );

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
	 * The Overview's "Your site speed" card. History and the sticky score bar repeat its region names.
	 * @return The card locator.
	 */
	scoresCard() {
		return this.page.locator( '.jetpack-boost-overview__scores-card' );
	}

	/**
	 * Returns the score for a specific platform.
	 * @param  platform - The platform to get the score for.
	 * @return {Promise<number>} - The score for the specified platform.
	 */
	async getSpeedScore( platform: 'Desktop' | 'Mobile' ): Promise< number > {
		const meter = this.scoresCard().getByRole( 'progressbar', { name: platform, exact: true } );
		await meter.waitFor( {
			state: 'visible',
			timeout: 80000,
		} );

		return Number( await meter.getAttribute( 'value' ) );
	}

	/**
	 * Expects the overall grade and speed scores to be visible and valid.
	 * Waits for both mobile and desktop scores to be greater than 0.
	 */
	async expectScoreToBeVisible() {
		await expect(
			this.scoresCard().getByRole( 'region', { name: 'Overall', exact: true } ),
			'Overall grade should be visible'
		).toContainText( /Overall\s*[A-F]/, { timeout: 60000 } );
		await expect( async () => {
			const mobileScore = await this.getSpeedScore( 'Mobile' );
			expect( mobileScore, 'Mobile score should be greater than 0' ).toBeGreaterThan( 0 );
		} ).toPass();
		await expect( async () => {
			const desktopScore = await this.getSpeedScore( 'Desktop' );
			expect( desktopScore, 'Desktop score should be greater than 0' ).toBeGreaterThan( 0 );
		} ).toPass();
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
	 * Clicks Generate in the Critical CSS row and waits for generation to finish.
	 * The modern dashboard never starts a manual generation on its own.
	 *
	 * @param {number} timeout - Maximum time to wait in milliseconds.
	 */
	async generateCriticalCss( timeout = 240000 ) {
		const generated = this.waitForCriticalCssGeneration( timeout );
		await this.page.getByRole( 'button', { name: 'Generate', exact: true } ).click();
		await generated;
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
	 * Returns the toggle of the collapsed Cornerstone Pages group in Settings.
	 * @return The toggle button locator.
	 */
	getCornerstonePagesToggle() {
		return this.page
			.getByRole( 'region', { name: 'Optimize your speed' } )
			.getByRole( 'button', { name: 'Cornerstone Pages', exact: true } );
	}

	/**
	 * Opens the Cornerstone Pages group and its nested pages list, both collapsed by default.
	 */
	async openCornerstonePagesPanel() {
		const textarea = await this.getCornerstonePagesTextarea();
		if ( await textarea.isVisible() ) {
			return;
		}
		const groupToggle = this.getCornerstonePagesToggle();
		if ( ( await groupToggle.getAttribute( 'aria-expanded' ) ) !== 'true' ) {
			await groupToggle.click();
		}
		await this.page.getByRole( 'button', { name: 'Customize pages list', exact: true } ).click();
		await expect( textarea, 'Cornerstone Pages list should be visible' ).toBeVisible();
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
		await this.expectNoticeToBeVisible( 'Cornerstone Pages saved' );
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

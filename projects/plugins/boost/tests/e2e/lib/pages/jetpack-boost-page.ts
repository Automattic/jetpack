import { expect, Page } from '@playwright/test';

// const apiEndpointsRegex = {
// 	'modules-state': /jetpack-boost-ds\/modules-state\/set/,
// };

export default class JetpackBoostPage {
	page: Page;

	constructor( page: Page ) {
		this.page = page;
	}

	async visit() {
		await this.page.goto( '/wp-admin/admin.php?page=jetpack-boost' );
	}

	async getCornerstonePagesTextarea() {
		return this.page.locator( '#jb-cornerstone-pages' );
	}

	/**
	 * Select the free plan from getting started page.
	 */
	async chooseFreePlan() {
		const button = this.page.locator( 'text=Start for free' );
		await button.click();

		// We should wait a longer time to ensure the connection/plan is complete/established.
		await this.isOverallScoreHeaderShown( 30 * 1000 );
	}

	// /**
	//  * Check if the site looks disconnected from WordPress.com based on elements on the dashboard page.
	//  * Specifically checks for a "Connect" button.
	//  *
	//  * @return {boolean}  - True if the dashboard looks disconnected. (Not offline mode)
	//  */
	// async isAwaitingConnection() {
	// 	// return await this.isElementVisible( '.jb-connection button' );
	// 	return await this.page.locator( '.jb-connection button' ).isVisible();
	// }

	// /**
	//  * Check if the site looks connected to WordPress.com based on elements on the dashboard page.
	//  * Looks for a "Site Score" area, which is not in "offline" mode.
	//  *
	//  * @return {boolean} - True if the dashboard looks connected to WordPRess.com.
	//  */
	// async isConnected(): Promise< boolean > {
	// 	const [ showingScoreArea, isOffline ] = await Promise.all( [
	// 		this.page.locator( '[data-testid="speed-scores"]' ).isVisible(),
	// 		this.page.locator( '[data-testid="speed-scores-offline"]' ).isVisible(),
	// 	] );

	// 	return showingScoreArea && ! isOffline;
	// }

	async isOverallScoreHeaderShown( timeout? ) {
		return await this.page.locator( '[data-testid="speed-scores"]' ).isVisible( { timeout } );
	}

	// async isSiteScoreLoading() {
	// 	const selector = this.page.locator( '[data-testid="speed-scores"]' );
	// 	const classNames = await selector.getAttribute( 'class' );
	// 	return classNames?.includes( 'loading' );
	// }

	// async waitForApiResponse( apiEndpointId, moduleName, expectedState ) {
	// 	await this.page.waitForResponse(
	// 		async response => {
	// 			const isSuccess = response.status() === 200;
	// 			if ( ! isSuccess ) {
	// 				return false;
	// 			}

	// 			const isMatch = response.url().match( apiEndpointsRegex[ apiEndpointId ] );
	// 			if ( ! isMatch ) {
	// 				return false;
	// 			}

	// 			const body = ( await response.json() )?.JSON;
	// 			console.log( `body[ ${ moduleName } ]?.active >`, body[ moduleName ]?.active );
	// 			console.log( 'expectedState >', expectedState );
	// 			return body[ moduleName ]?.active === expectedState;
	// 		},
	// 		{ timeout: 2 * 60 * 1000 }
	// 	);
	// }

	// /**
	//  * Toggle a module and wait for the success notice to appear.
	//  *
	//  * @param {string}  moduleName    - The name of the module to toggle.
	//  * @param {boolean} expectedState - The expected state of the module.
	//  */
	// async toggleModule( moduleName, expectedState ) {
	// 	console.log( `toggleModule > ${ moduleName } > ${ expectedState }` );

	// 	const stateSelector = expectedState ? ':not(.is-checked)' : '.is-checked';
	// 	const locator = `[data-testid="module-${ moduleName }"] .components-form-toggle${ stateSelector } input`;

	// 	const toggle = this.page.locator( locator );

	// 	toggle.click();

	// 	// Wait for the success notice to appear
	// 	const expectedMessage = expectedState ? 'Module activated' : 'Module deactivated';
	// 	const notice = this.page.locator( `.components-snackbar:has-text("${ expectedMessage }")` );
	// 	await notice.waitFor( {
	// 		timeout: 10000,
	// 	} );

	// 	// Wait for the notice to disappear
	// 	await notice.waitFor( {
	// 		timeout: 10000,
	// 		state: 'hidden',
	// 	} );
	// }

	// async waitForModuleState( moduleName, expectedState = true ) {
	// 	console.log( 'before >', expectedState );
	// 	const toggleSwitch = this.page.locator(
	// 		`.jb-feature-toggle-${ moduleName } .components-form-toggle`
	// 	);

	// 	// Wait for the toggle to reach the expected state
	// 	await toggleSwitch.waitFor();

	// 	// Wait for the element to have the expected class state
	// 	await expect( async () => {
	// 		const classNames = await toggleSwitch.getAttribute( 'class' );
	// 		const isChecked = classNames?.includes( 'is-checked' );
	// 		return expectedState ? isChecked : ! isChecked;
	// 	} ).toPass( { timeout: 10_000 } );

	// 	// Return whether the expected state was achieved
	// 	const classNames = await toggleSwitch.getAttribute( 'class' );
	// 	const actualState = classNames?.includes( 'is-checked' );
	// 	return actualState === expectedState;
	// }

	async getSpeedScore( platform ) {
		const parent = `div.jb-score-bar--${ platform }  .jb-score-bar__filler`;

		const score = this.page.locator( parent + ' .jb-score-bar__score' );
		await score.waitFor( {
			state: 'visible',
			timeout: 80 * 1000,
		} );

		return Number( await score.textContent() );
	}

	async isScorebarLoading( platform ) {
		const selector = `div.jb-score-bar--${ platform }  .jb-score-bar__loading`;
		return this.page.isVisible( selector );
	}

	async expectCriticalCssMetaInfoToBeVisible() {
		await expect(
			this.page.getByTestId( 'critical-css-meta' ),
			'Critical CSS meta information should be visible'
		).toBeVisible( { timeout: 4 * 60 * 1000 } );
	}

	async expectCriticalCssGenerationProgressUIToBeVisible() {
		await expect(
			this.page.locator( '.jb-critical-css-progress' ),
			'Critical CSS generation progress indicator should be visible'
		).toBeVisible();
	}

	async isCriticalCSSAdvancedRecommendationsVisible() {
		const selector = '.jb-critical-css__advanced';
		// return this.waitForElementToBeVisible( selector );
		// todo replace with expect(locator).toBeVisible()
		return this.page.locator( selector ).waitFor();
	}

	async isThePageCacheMetaInformationVisible() {
		const selector = '[data-testid="page-cache-meta"]';
		return this.page.isVisible( selector );
	}

	async waitForPageCacheMetaInfoVisibility() {
		const selector = '[data-testid="page-cache-meta"]';
		// return this.waitForElementToBeVisible( selector, 3 * 60 * 1000 );
		// todo replace with expect(locator).toBeVisible()
		return this.page.locator( selector ).waitFor( { timeout: 3 * 60 * 1000 } );
	}

	async waitForPageCachePermalinksErrorVisibility() {
		const selector = '[data-testid="module-page_cache"] >> text=Permalink settings must be updated';
		// return this.waitForElementToBeVisible( selector, 3 * 60 * 1000 );
		// todo replace with expect(locator).toBeVisible()
		return this.page.locator( selector ).waitFor( { timeout: 3 * 60 * 1000 } );
	}

	async navigateToMainSettingsPage() {
		await this.page.click( 'text=Go back' );
	}

	async clickRefreshSpeedScore() {
		const selector = '[data-testid="speed-scores-top"] >> text=Refresh';
		await this.page.click( selector );
	}

	async waitForScoreLoadingToFinish() {
		await this.isOverallScoreHeaderShown();

		const selector = '[data-testid="speed-scores-top"] h2:text("Loading…")';
		/* It needs a large timeout because speed score updates take time */
		// return this.waitForElementToBeDetached( selector, 180000 ); // 3 minutes
		await this.page.locator( selector ).waitFor( { state: 'detached', timeout: 180000 } );
	}

	async isScoreDescriptionPopinVisible() {
		const selector =
			'[data-testid="speed-scores-top"] .icon-tooltip-wrapper .components-popover__content';
		return this.page.isVisible( selector );
	}

	async isScoreLoading() {
		await expect( this.page.getByRole( 'heading', { name: 'Loading…' } ) ).toBeVisible();
		return (
			( await this.isScorebarLoading( 'desktop' ) ) && ( await this.isScorebarLoading( 'mobile' ) )
		);
	}

	/**
	 * Expects the overall score header and speed scores to be visible and valid.
	 * Waits for both mobile and desktop scores to be greater than 0.
	 */
	async expectScoreToBeVisible() {
		await expect(
			this.page.getByRole( 'heading', { name: /Overall Score: [A-Z]/i } ),
			'Overall score heading should be visible'
		).toBeVisible();
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

	async getCornerstonePageInputValue() {
		return ( await this.getCornerstonePagesTextarea() ).inputValue();
	}

	/**
	 * Waits for a notice to appear and checks its visibility.
	 * @param {string|RegExp} message - The message to wait for.
	 */
	async expectNoticeToBeVisible( message: string | RegExp ) {
		await expect(
			this.page.getByTestId( 'snackbar' ).getByText( message ),
			`Should show ${ message } notice`
		).toBeVisible();
	}

	async togglePrerenderOption( enabled ) {
		const toggle = this.page.locator( '[data-testid="prerender-cornerstone-pages-title"] input' );
		const isCurrentlyChecked = await toggle.isChecked();

		if ( isCurrentlyChecked !== enabled ) {
			await toggle.click();
		}
		await this.expectNoticeToBeVisible( `Prerender ${ enabled ? 'enabled' : 'disabled' }` );
	}
}

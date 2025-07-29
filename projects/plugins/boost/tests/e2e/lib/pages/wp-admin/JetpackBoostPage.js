import WpPage from '_jetpack-e2e-commons/pages/wp-page.js';
import pwConfig from '../../../playwright.config.mjs';

const apiEndpointsRegex = {
	'modules-state': /jetpack-boost-ds\/modules-state\/set/,
};

export default class JetpackBoostPage extends WpPage {
	constructor( page ) {
		const url = pwConfig.use.baseURL + '/wp-admin/admin.php?page=jetpack-boost';
		super( page, { expectedSelectors: [ '#jb-dashboard' ], url } );
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

	/**
	 * Check if the site looks disconnected from WordPress.com based on elements on the dashboard page.
	 * Specifically checks for a "Connect" button.
	 *
	 * @return {boolean}  - True if the dashboard looks disconnected. (Not offline mode)
	 */
	async isAwaitingConnection() {
		return await this.isElementVisible( '.jb-connection button' );
	}

	/**
	 * Check if the site looks connected to WordPress.com based on elements on the dashboard page.
	 * Looks for a "Site Score" area, which is not in "offline" mode.
	 *
	 * @return {boolean} - True if the dashboard looks connected to WordPRess.com.
	 */
	async isConnected() {
		const [ showingScoreArea, isOffline ] = await Promise.all( [
			this.isElementVisible( '[data-testid="speed-scores"]' ),
			this.isElementVisible( '[data-testid="speed-scores-offline"]' ),
		] );

		return showingScoreArea && ! isOffline;
	}

	async isOverallScoreHeaderShown( timeout ) {
		return await this.isElementVisible( '[data-testid="speed-scores"]', timeout );
	}

	async isSiteScoreLoading() {
		const selector = await this.waitForElementToBeVisible( '[data-testid="speed-scores"]' );
		const classNames = await selector.getAttribute( 'class' );
		return classNames.includes( 'loading' );
	}

	async waitForApiResponse( apiEndpointId, moduleName, expectedState ) {
		await this.page.waitForResponse(
			async response => {
				const isSuccess = response.status() === 200;
				if ( ! isSuccess ) {
					return false;
				}

				const isMatch = response.url().match( apiEndpointsRegex[ apiEndpointId ] );
				if ( ! isMatch ) {
					return false;
				}

				const body = ( await response.json() )?.JSON;
				console.log( `body[ ${ moduleName } ]?.active >`, body[ moduleName ]?.active );
				console.log( 'expectedState >', expectedState );
				return body[ moduleName ]?.active === expectedState;
			},
			{ timeout: 2 * 60 * 1000 }
		);
	}

	/**
	 * Toggle a module and wait for the success notice to appear.
	 *
	 * @param {string}  moduleName    - The name of the module to toggle.
	 * @param {boolean} expectedState - The expected state of the module.
	 */
	async toggleModule( moduleName, expectedState ) {
		console.log( `toggleModule > ${ moduleName } > ${ expectedState }` );

		const stateSelector = expectedState ? ':not(.is-checked)' : '.is-checked';
		const locator = `[data-testid="module-${ moduleName }"] .components-form-toggle${ stateSelector } input`;

		const toggle = this.page.locator( locator );

		toggle.click();

		// Wait for the success notice to appear
		const expectedMessage = expectedState ? 'Module activated' : 'Module deactivated';
		const notice = this.page.locator( `.components-snackbar:has-text("${ expectedMessage }")` );
		await notice.waitFor( {
			timeout: 10000,
		} );

		// Wait for the notice to disappear
		await notice.waitFor( {
			timeout: 10000,
			state: 'hidden',
		} );
	}

	async waitForModuleState( moduleName, expectedState = true ) {
		console.log( 'before >', expectedState );
		const toggleSwitch = this.page.locator(
			`.jb-feature-toggle-${ moduleName } .components-form-toggle`
		);

		// Wait for the toggle to reach the expected state
		await toggleSwitch.waitFor();

		// Wait for the element to have the expected class state
		await toggleSwitch.waitFor( async () => {
			const classNames = await toggleSwitch.getAttribute( 'class' );
			const isChecked = classNames.includes( 'is-checked' );
			return expectedState ? isChecked : ! isChecked;
		} );

		// Return whether the expected state was achieved
		const classNames = await toggleSwitch.getAttribute( 'class' );
		const actualState = classNames.includes( 'is-checked' );
		return actualState === expectedState;
	}

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

	async isTheCriticalCssMetaInformationVisible() {
		const selector = '[data-testid="critical-css-meta"]';
		return this.page.isVisible( selector );
	}

	async waitForCriticalCssMetaInfoVisibility() {
		const selector = '[data-testid="critical-css-meta"]';
		return this.waitForElementToBeVisible( selector, 4 * 60 * 1000 );
	}

	async waitForCriticalCssGenerationProgressUIVisibility() {
		const selector = '.jb-critical-css-progress';
		return this.waitForElementToBeVisible( selector );
	}

	async isTheCriticalCssFailureMessageVisible() {
		const selector = '[data-testid="critical-css-meta"] .failures';
		return this.page.isVisible( selector );
	}

	async navigateToCriticalCSSAdvancedRecommendations() {
		await this.page.click( 'text=Advanced Recommendations' );
	}

	async isCriticalCSSAdvancedRecommendationsVisible() {
		const selector = '.jb-critical-css__advanced';
		return this.waitForElementToBeVisible( selector );
	}

	async isThePageCacheMetaInformationVisible() {
		const selector = '[data-testid="page-cache-meta"]';
		return this.page.isVisible( selector );
	}

	async waitForPageCacheMetaInfoVisibility() {
		const selector = '[data-testid="page-cache-meta"]';
		return this.waitForElementToBeVisible( selector, 3 * 60 * 1000 );
	}

	async waitForPageCachePermalinksErrorVisibility() {
		const selector = '[data-testid="module-page_cache"] >> text=Permalink settings must be updated';
		return this.waitForElementToBeVisible( selector, 3 * 60 * 1000 );
	}

	async isConcatenateJsMetaVisible() {
		const selector = '[data-testid="meta-minify_js_excludes"]';
		return this.page.isVisible( selector );
	}

	async isConcatenateCssMetaVisible() {
		const selector = '[data-testid="meta-minify_css_excludes"]';
		return this.page.isVisible( selector );
	}

	async isImageCdnUpgradeSectionVisible() {
		const selector =
			'[data-testid="module-image_cdn"] >> text=Auto-resize lazy images and adjust their quality.';
		return this.page.isVisible( selector );
	}

	async navigateToMainSettingsPage() {
		await this.page.click( 'text=Go back' );
	}

	async clickRefreshSpeedScore() {
		const selector = '[data-testid="speed-scores-top"] >> text=Refresh';
		await this.page.click( selector );
	}

	async currentPageTitleIs( expected ) {
		const actualTitle = await this.page.evaluate( () => {
			const selector = '[data-testid="speed-scores-top"] h2';
			// eslint-disable-next-line no-undef
			return document.querySelector( selector ).textContent;
		} );

		return actualTitle.match( expected );
	}

	async waitForScoreLoadingToFinish() {
		await this.isOverallScoreHeaderShown();

		const selector = '[data-testid="speed-scores-top"] h2:text("Loading…")';
		/* It needs a large timeout because speed score updates take time */
		return this.waitForElementToBeDetached( selector, 180000 ); // 3 minutes
	}

	async isScoreDescriptionPopinVisible() {
		const selector =
			'[data-testid="speed-scores-top"] .icon-tooltip-wrapper .components-popover__content';
		return this.page.isVisible( selector );
	}

	async isScoreLoading() {
		return (
			( await this.currentPageTitleIs( 'Loading…' ) ) &&
			( await this.isScorebarLoading( 'desktop' ) ) &&
			( await this.isScorebarLoading( 'mobile' ) )
		);
	}

	async isScoreVisible() {
		return (
			( await this.getSpeedScore( 'mobile' ) ) > 0 &&
			( await this.getSpeedScore( 'desktop' ) ) > 0 &&
			( await this.currentPageTitleIs( /Overall Score: [A-Z]/i ) )
		);
	}

	async isCornerstonePagesContentVisible() {
		return await this.page.getByText( 'List the most important pages' ).isVisible();
	}

	async openCornerstonePagesPanel() {
		const panelToggle = this.page.locator( 'text=Cornerstone Pages' ).first();
		if ( ! ( await this.isCornerstonePagesContentVisible() ) ) {
			await panelToggle.click();
			await this.isCornerstonePagesContentVisible();
		}
	}

	async enterCornerstonePageUrl( url ) {
		const textarea = this.page.locator( '#jb-cornerstone-pages' );
		await textarea.fill( url );
	}

	async clearCornerstonePageInput() {
		const textarea = this.page.locator( '#jb-cornerstone-pages' );
		await textarea.fill( '' );
	}

	async addCornerstonePage( url ) {
		await this.enterCornerstonePageUrl( url );
		const saveButton = this.page.locator( 'text=Save' ).first();
		await saveButton.click();
	}

	async getCornerstonePageInputValue() {
		const textarea = this.page.locator( '#jb-cornerstone-pages' );
		return await textarea.inputValue();
	}

	async isCornerstoneSaveButtonDisabled() {
		const saveButton = this.page.locator( 'text=Save' ).first();
		return await saveButton.isDisabled();
	}

	async isCornerstoneUpgradeCTAVisible() {
		const selector = 'text=Premium users can add up to 10 cornerstone pages';
		return this.page.isVisible( selector );
	}

	async isPremiumFeatureDetected() {
		return await this.page
			.getByRole( 'button', { name: 'Cornerstone Pages Upgraded' } )
			.isVisible();
	}

	async waitForNotice( message ) {
		const notice = this.page.locator( `.components-snackbar:has-text("${ message }")` );
		await notice.waitFor( {
			timeout: 10000,
		} );
	}

	// Prerender methods
	async isPrerenderToggleVisible() {
		const selector = 'text=Prerender Cornerstone Pages';
		return this.page.isVisible( selector );
	}

	async togglePrerenderOption( enabled ) {
		const toggle = this.page.locator( '[data-testid="prerender-cornerstone-pages-title"] input' );
		const isCurrentlyChecked = await toggle.isChecked();

		if ( isCurrentlyChecked !== enabled ) {
			await toggle.click();
		}
	}

	async waitForLcpOptimizationStatus( status, timeout = 30000 ) {
		// Map status to the expected UI indicators
		const statusSelectors = {
			pending: "text=Jetpack Boost is optimizing your Cornerstone Page's LCP for you.",
			analyzed: 'text=Last optimized',
			error: '.jb-feature-content-lcp .failures',
		};

		const selector = statusSelectors[ status ];
		if ( ! selector ) {
			throw new Error( `Unknown LCP status: ${ status }` );
		}

		return this.waitForElementToBeVisible( selector, timeout );
	}

	async isLcpLastOptimizedVisible() {
		const selector = '[data-testid="module-lcp"] .successes:has-text("Last optimized")';
		return this.page.isVisible( selector );
	}

	async enableLcpOptimizationButton() {
		const button = this.page.locator( '[data-testid="module-lcp"] input' );
		await button.click();
	}

	async clickLcpOptimizeButton() {
		const button = this.page.getByRole( 'button', { name: 'Optimize' } );
		await button.click();
	}

	async isLcpOptimizeButtonDisabled() {
		const button = this.page.getByRole( 'button', { name: 'Optimize' } );
		return await button.isDisabled();
	}

	async isLcpBetaPillVisible() {
		const selector = '[data-testid="module-lcp"] .pill:has-text("Beta")';
		return this.page.isVisible( selector );
	}
}

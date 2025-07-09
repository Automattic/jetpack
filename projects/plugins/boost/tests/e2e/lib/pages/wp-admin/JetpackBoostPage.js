import { resolveSiteUrl } from '_jetpack-e2e-commons/helpers/utils-helper.js';
import WpPage from '_jetpack-e2e-commons/pages/wp-page.js';

const apiEndpointsRegex = {
	'modules-state': /jetpack-boost-ds\/modules-state\/set/,
};

export default class JetpackBoostPage extends WpPage {
	constructor( page ) {
		const url = resolveSiteUrl() + '/wp-admin/admin.php?page=jetpack-boost';
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
}

import WpPage from 'jetpack-e2e-commons/pages/wp-page.js';
import { resolveSiteUrl } from 'jetpack-e2e-commons/helpers/utils-helper.cjs';

const apiEndpointsRegex = {
	'critical-css-status': /jetpack-boost\/v1\/module\/critical-css\/status/,
	'lazy-images-status': /jetpack-boost\/v1\/module\/lazy-images\/status/,
	'render-blocking-js-status': /jetpack-boost\/v1\/module\/render-blocking-js\/status/,
	'speed-scores-update': /jetpack-boost\/v1\/speed-scores\/\w*\/update/,
	connection: /jetpack-boost\/v1\/connection/,
};

export default class JetpackBoostPage extends WpPage {
	constructor( page ) {
		const url = resolveSiteUrl() + '/wp-admin/admin.php?page=jetpack-boost';
		super( page, { expectedSelectors: [ '#jb-settings' ], url } );
	}

	/**
	 * Tries to connect Jetpack Boost to WordPress.com, and waits for the connection API call to complete.
	 */
	async connect() {
		const button = await this.page.$( '.jb-connection button' );
		await button.click();
		await this.waitForApiResponse( 'connection' );
		await this.waitForApiResponse( 'optimizations/status' );
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
			this.isElementVisible( '.jb-site-score' ),
			this.isElementVisible( '.jb-site-score__offline' ),
		] );

		return showingScoreArea && ! isOffline;
	}

	async isOverallScoreHeaderShown() {
		return await this.isElementVisible( '.jb-site-score' );
	}

	async isSiteScoreLoading() {
		const selector = await this.waitForElementToBeVisible( '.jb-site-score' );
		const classNames = await selector.getAttribute( 'class' );
		return classNames.includes( 'loading' );
	}

	async waitForApiResponse( apiEndpointId ) {
		await this.page.waitForResponse(
			response =>
				response.url().match( apiEndpointsRegex[ apiEndpointId ] ) && response.status() === 200,
			{ timeout: 2 * 60 * 1000 }
		);
	}

	async toggleModule( moduleName ) {
		this.page.click( `#jb-feature-toggle-${ moduleName }` );
		await this.waitForApiResponse( `${ moduleName }-status` );
	}

	async isModuleEnabled( moduleName ) {
		const toggle = await this.page.waitForSelector( `#jb-feature-toggle-${ moduleName }` );
		const toggleParent = await toggle.waitForSelector( 'xpath=..' );
		const classNames = await toggleParent.getAttribute( 'class' );

		return classNames.includes( 'is-checked' );
	}

	async getSpeedScore( platform ) {
		const speedBar = await this.page.waitForSelector(
			`div.jb-score-bar--${ platform }  .jb-score-bar__filler`
		);
		await this.page.waitForSelector( '.jb-score-bar__score', {
			state: 'visible',
			timeout: 40 * 1000,
		} );
		return Number( await speedBar.$eval( '.jb-score-bar__score', e => e.textContent ) );
	}

	async isScorebarLoading( platform ) {
		const selector = `div.jb-score-bar--${ platform }  .jb-score-bar__loading`;
		return this.page.isVisible( selector );
	}

	async isTheCriticalCssMetaInformationVisible() {
		const selector = '.jb-critical-css__meta';
		return this.page.isVisible( selector );
	}

	async waitForCriticalCssMetaInfoVisibility() {
		const selector = '.jb-critical-css__meta';
		return this.waitForElementToBeVisible( selector, 3 * 60 * 1000 );
	}

	async waitForCriticalCssGenerationProgressUIVisibility() {
		const selector = '.jb-critical-css-progress';
		return this.waitForElementToBeVisible( selector );
	}

	async isTheCriticalCssFailureMessageVisible() {
		const selector = '.jb-critical-css__meta .failures';
		return this.page.isVisible( selector );
	}

	async navigateToCriticalCSSAdvancedRecommendations() {
		await this.page.click( 'text=Advanced Recommendations' );
	}

	async isCriticalCSSAdvancedRecommendationsVisible() {
		const selector = '.jb-critical-css__advanced';
		return this.waitForElementToBeVisible( selector );
	}

	async navigateToMainSettingsPage() {
		await this.page.click( 'text=Go back' );
	}

	async clickRefreshSpeedScore() {
		const selector = '.jb-site-score__top >> text=Refresh';
		await this.page.click( selector );
	}

	async currentPageTitleIs( expected ) {
		const actualTitle = await this.page.evaluate( () => {
			const selector = '.jb-site-score__top h2';
			// eslint-disable-next-line no-undef
			return document.querySelector( selector ).textContent;
		} );

		return actualTitle.match( expected );
	}

	async waitForScoreLoadingToFinish() {
		const selector = '.jb-site-score__top h2:text("Loading…")';
		/* It needs a large timeout because speed score updates take time */
		return this.waitForElementToBeDetached( selector, 180000 ); // 3 minutes
	}

	async isScoreDescriptionPopinVisible() {
		const selector = '.jb-score-context__info-container';
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
			( await this.currentPageTitleIs( /Overall score: [A-Z]/ ) )
		);
	}
}

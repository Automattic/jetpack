import WpPage from 'jetpack-e2e-commons/pages/wp-page.js';
import { resolveSiteUrl } from 'jetpack-e2e-commons/helpers/utils-helper.cjs';

const apiEndpointsRegex = {
	'critical-css-status': /jetpack-boost\/v1\/module\/critical-css\/status/,
	'lazy-images-status': /jetpack-boost\/v1\/module\/lazy-images\/status/,
	'render-blocking-js-status': /jetpack-boost\/v1\/module\/render-blocking-js\/status/,
	'speed-scores-update': /jetpack-boost\/v1\/speed-scores\/\w*\/update/,
};

export default class JetpackBoostPage extends WpPage {
	constructor( page ) {
		const url = resolveSiteUrl() + '/wp-admin/admin.php?page=jetpack-boost';
		super( page, { expectedSelectors: [ '#jb-settings' ], url } );
	}

	async connect() {
		const button = await this.page.$( '.jb-connection button' );
		await button.click();
	}

	async isFreshlyConnected() {
		await this.connect();
		await this.waitForApiResponse( 'connection' );
		return await this.isSiteScoreLoading();
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
		} );
		return Number( await speedBar.$eval( '.jb-score-bar__score', e => e.textContent ) );
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
}

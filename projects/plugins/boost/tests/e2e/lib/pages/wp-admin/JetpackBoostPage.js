/**
 * Internal dependencies
 */
import WpPage from 'jetpack-e2e-commons/pages/wp-page';

const apiEndpointsRegex = {
	'critical-css-status': /jetpack-boost\/v1\/module\/critical-css\/status/,
	'speed-scores-update': /jetpack-boost\/v1\/speed-scores\/\w*\/update/,
};

export default class JetpackBoostPage extends WpPage {
	constructor( page ) {
		const url = siteUrl + '/wp-admin/admin.php?page=jetpack-boost';
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
		const scoreSiteContainer = await this.page.$( '.jb-site-score' );
		const classNames = await scoreSiteContainer.getAttribute( 'class' );
		return classNames.includes( 'loading' );
	}

	async waitForApiResponse( apiEndpointId ) {
		await page.waitForResponse(
			response =>
				response.url().match( apiEndpointsRegex[ apiEndpointId ] ) && response.status() === 200,
			{ timeout: 2 * 60 * 1000 }
		);
	}

	async toggleModule( moduleName ) {
		const toggle = await this.page.$( `#jb-feature-toggle-${ moduleName }` );
		await toggle.click();
	}

	async isModuleEnabled( moduleName ) {
		const toggle = await this.page.$( `#jb-feature-toggle-${ moduleName }` );
		const toggleParent = await toggle.$( 'xpath=..' );
		const classNames = await toggleParent.getAttribute( 'class' );

		return classNames.includes( 'is-checked' );
	}

	async getSpeedScore( platform ) {
		const speedBar = await page.$( `div.jb-score-bar--${ platform } .jb-score-bar__filler` );
		await page.waitForSelector( '.jb-score-bar__score', {
			state: 'visible',
		} );
		return Number( await speedBar.$eval( '.jb-score-bar__score', e => e.textContent ) );
	}
}

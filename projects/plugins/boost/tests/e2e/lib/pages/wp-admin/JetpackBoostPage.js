/**
 * Internal dependencies
 */
import WpPage from 'jetpack-e2e-commons/pages/wp-page';
import { resolveSiteUrl } from 'jetpack-e2e-commons/helpers/utils-helper.cjs';

const apiEndpointsRegex = {
	'critical-css-status': /jetpack-boost\/v1\/module\/critical-css\/status/,
	'speed-scores-update': /jetpack-boost\/v1\/speed-scores\/\w*\/update/,
};

export default class JetpackBoostPage extends WpPage {
	constructor( page ) {
		const url = resolveSiteUrl() + '/wp-admin/admin.php?page=jetpack-boost';
		super( page, { expectedSelectors: [ '#jb-settings' ], url } );
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
		const speedBar = await page.$( `div.jb-score-bar--${ platform }  .jb-score-bar__filler` );
		await page.waitForSelector( '.jb-score-bar__score', {
			state: 'visible',
		} );
		return Number( await speedBar.textContent( 'div.jb-score-bar__score' ) );
	}
}

import WpPage from 'jetpack-e2e-commons/pages/wp-page.js';
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
		return Number( await speedBar.textContent( 'div.jb-score-bar__score' ) );
	}
}

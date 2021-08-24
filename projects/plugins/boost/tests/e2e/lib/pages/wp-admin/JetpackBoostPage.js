/**
 * Internal dependencies
 */
import WpPage from '../WpPage';

export default class JetpackBoostPage extends WpPage {
	constructor( page ) {
		const url = siteUrl + '/wp-admin/admin.php?page=jetpack-boost';
		super( page, { expectedSelectors: [ '#jb-settings' ], url } );
	}

	async waitForSiteScoreUpdateApiResponse() {
		return await this.page.waitForResponse(
			response =>
				response.url().match( /jetpack-boost\/v1\/speed-scores\/\w*\/update/ ) &&
				response.status() === 200,
			{ timeout: 60 * 1000 }
		);
	}
}

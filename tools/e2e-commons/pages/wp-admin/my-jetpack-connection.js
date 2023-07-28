import WpPage from '../wp-page.js';
import logger from '../../logger.cjs';
import { resolveSiteUrl } from '../../helpers/utils-helper.cjs';

export default class MyJetpackConnectionPage extends WpPage {
	constructor( page ) {
		const url = resolveSiteUrl() + '/wp-admin/admin.php?page=my-jetpack#/connection';
		super( page, { expectedSelectors: [ '#my-jetpack-container' ], url } );
	}

	async isConnectScreenVisible() {
		logger.step( 'Checking if Connect screen is visible' );

		const containerSelector = '.jp-connection__connect-screen';
		const connectButtonSelector = '.jp-connection__connect-screen button.jp-action-button--button';

		await this.waitForElementToBeVisible( containerSelector );
		return await this.isElementVisible( connectButtonSelector );
	}
}

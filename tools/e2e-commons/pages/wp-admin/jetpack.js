import WpPage from '../wp-page.js';
import logger from '../../logger.cjs';
import { resolveSiteUrl } from '../../helpers/utils-helper.cjs';

export default class JetpackPage extends WpPage {
	constructor( page ) {
		const url = resolveSiteUrl() + '/wp-admin/admin.php?page=jetpack#/';
		super( page, { expectedSelectors: [ '#jp-plugin-container' ], url } );
	}

	async connect() {
		logger.step( 'Starting Jetpack connection' );
		const connectButtonSelector = '.jp-connection__connect-screen .jp-action-button--button';
		await this.click( connectButtonSelector );
		await this.waitForElementToBeHidden( this.selectors[ 0 ], 60000 );
	}

	async isConnectScreenVisible() {
		logger.step( 'Checking if Connect screen is visible' );

		const containerSelector = '.jp-connection__connect-screen';
		const buttonSelector = '.jp-connection__connect-screen button.jp-action-button--button';

		await this.waitForElementToBeVisible( containerSelector );
		return await this.isElementVisible( buttonSelector );
	}
}

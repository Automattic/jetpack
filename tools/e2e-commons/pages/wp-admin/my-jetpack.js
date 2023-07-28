import WpPage from '../wp-page.js';
import logger from '../../logger.cjs';
import { resolveSiteUrl } from '../../helpers/utils-helper.cjs';

export default class MyJetpackPage extends WpPage {
	constructor( page ) {
		const url = resolveSiteUrl() + '/wp-admin/admin.php?page=my-jetpack';
		super( page, {
			expectedSelectors: [ '#my-jetpack-container' ],
			url,
			explicitWaitMS: 30000,
		} );
	}

	async isConnectNoticeVisible() {
		logger.step( 'Checking if connection notice is visible' );
		const selector = '.components-notice button.components-notice__action';
		return await this.isElementVisible( selector );
	}

	async clickNoticeConnectButton() {
		logger.step( 'Clicking the connection notice button' );
		const buttonSelector = '.components-notice button.components-notice__action';
		await this.click( buttonSelector );
	}

	async isConnectScreenVisible() {
		logger.step( 'Checking if Connect screen is visible' );

		const containerSelector = '.jp-connection__connect-screen';
		const connectButtonSelector = '.jp-connection__connect-screen button.jp-action-button--button';

		await this.waitForElementToBeVisible( containerSelector );
		return await this.isElementVisible( connectButtonSelector );
	}
}

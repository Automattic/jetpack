import WpPage from '../wp-page.js';
import logger from '../../logger.cjs';
import { resolveSiteUrl } from '../../helpers/utils-helper.cjs';

export default class MyJetpackPage extends WpPage {
	constructor( page ) {
		const url = resolveSiteUrl() + '/wp-admin/admin.php?page=my-jetpack';
		super( page, {
			expectedSelectors: [ '.my-jetpack-page-heading' ],
			url,
		} );
	}

	async isConnectNoticeVisible() {
		logger.step( 'Checking if connection notice is visible' );
		const selector = '.components-notice';

		return await this.isElementVisible( selector );
	}

	async clickNoticeConnectButton() {
		logger.step( 'Clicking the connection notice button' );
		const buttonSelector = '.components-notice button.components-notice__action';

		return await this.click( buttonSelector );
	}

	async isMyJetpackConnectionRoute() {
		logger.step( 'Checking if the current URL is the My Jetpack Connection page' );
		const myJetpackConnectionPageRoute = '**/admin.php?page=my-jetpack#/connection';
		await this.page.waitForURL( myJetpackConnectionPageRoute );

		return this.page.url().endsWith( '/admin.php?page=my-jetpack#/connection' );
	}

	async isConnectScreenVisible() {
		logger.step( 'Checking if the connection screen is visible' );
		const containerSelector = '.jp-connection__connect-screen';
		await this.waitForElementToBeVisible( containerSelector );

		return await this.isElementVisible( containerSelector );
	}

	async isConnectScreenConnectButtonVisible() {
		logger.step( 'Checking if the connect screen Connect Button is visible' );
		const connectButtonSelector = '.jp-connection__connect-screen button.jp-action-button--button';

		return await this.isElementVisible( connectButtonSelector );
	}
}

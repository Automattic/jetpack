import pwConfig from '../../playwright.config.mjs';
import PageActions from '../page-actions.js';
import WpPage from '../wp-page.js';

export default class DashboardPage extends WpPage {
	constructor( page ) {
		const url = `${ pwConfig.use.baseURL }/wp-admin`;
		super( page, { expectedSelectors: [ '#dashboard-widgets-wrap' ], url } );
	}

	static async isDisplayed( page ) {
		const pa = new PageActions( page );
		await pa.waitForDomContentLoaded();
		return await pa.isElementVisible( '#dashboard-widgets-wrap', 2000 );
	}

	async isConnectBannerVisible() {
		const selector = ".jp-connection-banner a[href*='register']";
		return await this.isElementVisible( selector );
	}

	async connect() {
		const selector = ".jp-connection-banner a[href*='register']";
		return await this.click( selector );
	}
}

import WpPage from '../wp-page.js';
import { resolveSiteUrl } from '../../helpers/utils-helper.cjs';

export default class DashboardPage extends WpPage {
	constructor( page ) {
		const url = `${ resolveSiteUrl() }/wp-admin`;
		super( page, { expectedSelectors: [ '#dashboard-widgets-wrap' ], url } );
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

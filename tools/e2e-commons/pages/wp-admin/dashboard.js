import WpPage from '../wp-page';

export default class DashboardPage extends WpPage {
	constructor( page ) {
		const url = `${ siteUrl }/wp-admin`;
		super( page, { expectedSelectors: [ '#dashboard-widgets-wrap' ], url } );
	}

	async isConnectBannerVisible() {
		const selector = ".jp-wpcom-connect__container a[href*='register']";
		return await this.isElementVisible( selector );
	}

	async connect() {
		const selector = ".jp-wpcom-connect__container a[href*='register']";
		return await this.click( selector );
	}
}

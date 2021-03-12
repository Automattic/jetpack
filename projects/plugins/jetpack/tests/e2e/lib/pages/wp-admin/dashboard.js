/**
 * Internal dependencies
 */
import WpPage from '../wp-page';
import { getTunnelSiteUrl } from '../../utils-helper';

export default class DashboardPage extends WpPage {
	constructor( page ) {
		const expectedSelector = '#dashboard-widgets-wrap';
		const url = getTunnelSiteUrl() + '/wp-admin';
		super( page, 'Dashboard page', { expectedSelector, url } );
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

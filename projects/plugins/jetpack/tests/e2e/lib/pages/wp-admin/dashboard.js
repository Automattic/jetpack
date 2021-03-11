/**
 * Internal dependencies
 */
import Page from '../page';
import { getTunnelSiteUrl } from '../../utils-helper';

export default class DashboardPage extends Page {
	constructor( page ) {
		const expectedSelector = '#dashboard-widgets-wrap';
		const url = getTunnelSiteUrl() + '/wp-admin';
		super( page, 'DashboardPage', { expectedSelector, url } );
	}

	async isConnectBannerVisible() {
		const selector = ".jp-wpcom-connect__container a[href*='register']";
		return await this.page.isVisible( selector );
	}

	async connect() {
		const selector = ".jp-wpcom-connect__container a[href*='register']";
		return await this.page.click( selector );
	}
}

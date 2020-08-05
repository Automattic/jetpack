/**
 * Internal dependencies
 */
import Page from '../page';
import { isEventuallyVisible, waitAndClick } from '../../page-helper';
import { getNgrokSiteUrl } from '../../utils-helper';

export default class DashboardPage extends Page {
	constructor( page ) {
		const expectedSelector = '#dashboard-widgets-wrap';
		const url = getNgrokSiteUrl() + '/wp-admin';
		super( page, { expectedSelector, url } );
	}

	async isConnectBannerVisible() {
		const selector = ".jp-wpcom-connect__container a[href*='register']";
		return await isEventuallyVisible( this.page, selector );
	}

	async connect() {
		const selector = ".jp-wpcom-connect__container a[href*='register']";
		return await waitAndClick( this.page, selector );
	}
}

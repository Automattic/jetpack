/**
 * Internal dependencies
 */
import Page from '../page';
import { isEventuallyVisible, waitAndClick } from '../../page-helper';

export default class DashboardPage extends Page {
	constructor( page ) {
		const expectedSelector = '#dashboard-widgets-wrap';
		super( page, { expectedSelector } );
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

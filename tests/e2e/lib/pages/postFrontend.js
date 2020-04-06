/**
 * Internal dependencies
 */
import Page from './page';
import { waitAndClick, waitForSelector } from '../page-helper';

export default class PostFrontendPage extends Page {
	constructor( page ) {
		const expectedSelector = '.post';
		super( page, { expectedSelector } );
	}

	/**
	 * Checks whether specific block is rendered on frontend. All the custom logic is defined in block's `isRendered` static method
	 * @param {Class} BlockClass Block class that has a static `isRendered` method
	 * @param {Object} args An object of any additional instance values required by the class `isRendered` method
	 */
	async isRenderedBlockPresent( BlockClass, args ) {
		return await BlockClass.isRendered( this.page, args );
	}

	async logout() {
		const accountBarSelector = '#wp-admin-bar-my-account';
		const logoutOptionSelector = '#wp-admin-bar-logout';
		await waitForSelector( this.page, accountBarSelector );
		await this.page.hover( accountBarSelector );
		await waitAndClick( this.page, logoutOptionSelector );
	}
}

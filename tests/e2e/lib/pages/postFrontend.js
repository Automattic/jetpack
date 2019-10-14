/**
 * Internal dependencies
 */
import Page from './page';
import { waitAndClick, waitForSelector } from '../page-helper';

export default class PostFrontendPage extends Page {
	constructor( page ) {
		const expectedSelector = '#main article.post';
		super( page, { expectedSelector } );
	}

	/**
	 * Checks whether specific block is rendered on frontend. All the custom logic is defined in block's `isRendered` static method
	 * @param {Class} BlockClass Block class that has a static `isRendered` method
	 */
	async isRenderedBlockPresent( BlockClass ) {
		return await BlockClass.isRendered( this.page );
	}

	async logout() {
		const accountBarSelector = '#wp-admin-bar-my-account';
		const logoutOptionSelector = '#wp-admin-bar-logout';
		await waitForSelector( this.page, accountBarSelector );
		await this.page.hover( accountBarSelector );
		await waitAndClick( this.page, logoutOptionSelector );
	}
}

/**
 * Internal dependencies
 */
import Page from './page';

export default class PostFrontendPage extends Page {
	constructor( page ) {
		const expectedSelector = '.post';
		super( page, { expectedSelector } );
	}

	/**
	 * Checks whether specific block is rendered on frontend. All the custom logic is defined in block's `isRendered` static method
	 *
	 * @param {Object} BlockClass Block class that has a static `isRendered` method
	 * @param {Object} args An object of any additional instance values required by the class `isRendered` method
	 */
	async isRenderedBlockPresent( BlockClass, args ) {
		await BlockClass.isRendered( this.page, args );
		return true;
	}

	async logout() {
		const accountBarSelector = '#wp-admin-bar-my-account';
		const logoutOptionSelector = '#wp-admin-bar-logout';
		await this.page.waitForSelector( accountBarSelector );
		await this.page.hover( accountBarSelector );
		await page.click( logoutOptionSelector );
	}
}

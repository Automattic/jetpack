import { resolveSiteUrl } from '../../helpers/utils-helper.js';
import WpPage from '../wp-page.js';

export default class PostFrontendPage extends WpPage {
	constructor( page ) {
		const url = resolveSiteUrl();
		super( page, { url } );
	}

	/**
	 * Checks whether specific block is rendered on frontend. All the custom logic is defined in block's `isRendered` static method
	 *
	 * @param {object} BlockClass - Block class that has a static `isRendered` method
	 * @param {object} args       - An object of any additional instance values required by the class `isRendered` method
	 * @returns {boolean} Always true.
	 */
	async isRenderedBlockPresent( BlockClass, args ) {
		await BlockClass.isRendered( this.page, args );
		return true;
	}

	async logout() {
		const accountBarSelector = '#wp-admin-bar-my-account';
		const logoutOptionSelector = '#wp-admin-bar-logout';
		await this.waitForElementToBeVisible( accountBarSelector );
		await this.hover( accountBarSelector );
		await this.click( logoutOptionSelector );
	}
}

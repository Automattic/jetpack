/**
 * Internal dependencies
 */
import logger from '../logger';
import PageActions from './page-actions';

export default class WpPage extends PageActions {
	constructor( page, pageName, { expectedSelector, url = null, explicitWaitMS = 25000 } ) {
		super( page, pageName, [ expectedSelector ] );
		this.expectedSelector = expectedSelector;
		this.visit = false;
		this.url = url;
		this.explicitWaitMS = explicitWaitMS;
	}

	/**
	 * Static method which initialize a page object. Also waits for `this.expectedSelector` to become visible, which kinda simulates page loads
	 *
	 * @param {page} page Playwright representation of the page.
	 *
	 * @return {WpPage} Instance of the Page Object class
	 */
	static async init( page ) {
		const it = new this( page );
		await it.waitForPage();
		return it;
	}

	/**
	 *
	 * @param {page} page Playwright representation of the page
	 * @param {string} pageURL Page URL
	 */
	static async visit( page, pageURL = null ) {
		const it = new this( page );
		const url = pageURL ? pageURL : it.url;
		await page.goto( url );
		return this.init( page );
	}

	/**
	 * Adds the store_sandbox cookie
	 *
	 * @param {string} sandboxCookieValue Cookie value
	 * @param {string} domain Cookie domain
	 */
	async setSandboxModeForPayments( sandboxCookieValue, domain = '.wordpress.com' ) {
		await this.setCookie( {
			name: 'store_sandbox',
			value: sandboxCookieValue,
			domain,
		} );
	}
}

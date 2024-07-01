import PageActions from './page-actions.js';

export default class WpPage extends PageActions {
	constructor( page, { pageName, expectedSelectors, url = undefined, explicitWaitMS = null } ) {
		super( page, pageName, expectedSelectors, explicitWaitMS );
		this.url = url;
	}

	/**
	 * Static method which initialize a page object and checks the page loaded
	 *
	 * @param {object}  page           - Playwright representation of the page.
	 * @param {boolean} checkSelectors - whether to also check for expected selectors
	 * @returns {Promise<WpPage>} Instance of the Page Object class
	 */
	static async init( page, checkSelectors = true ) {
		const it = new this( page );
		await it.waitForPage( checkSelectors );
		return it;
	}

	/**
	 * Static method which initialize a page object, goes to a URL, and checks the page loaded
	 *
	 * @param {object}  page           - Playwright type representation of the page
	 * @param {boolean} checkSelectors - whether to also check for expected selectors
	 * @returns {Promise<WpPage>} Instance of the Page Object class
	 */
	static async visit( page, checkSelectors = true ) {
		const it = new this( page );
		await it.goto( it.url );

		return this.init( page, checkSelectors );
	}

	/**
	 * Adds the store_sandbox cookie
	 *
	 * @param {string} sandboxCookieValue - Cookie value
	 * @param {string} domain             - Cookie domain
	 */
	async setSandboxModeForPayments( sandboxCookieValue, domain = '.wordpress.com' ) {
		await this.setCookie( {
			name: 'store_sandbox',
			value: sandboxCookieValue,
			domain,
		} );
	}
}

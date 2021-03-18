/**
 * Internal dependencies
 */
import PageActions from './page-actions';

export default class WpPage extends PageActions {
	constructor( page, { pageName, expectedSelectors, url = null, explicitWaitMS = null } ) {
		super( page, pageName, expectedSelectors, explicitWaitMS );
		this.url = url;
	}

	/**
	 * Static method which initialize a page object and checks the page loaded
	 *
	 * @param {page} page Playwright representation of the page.
	 * @return {WpPage} Instance of the Page Object class
	 */
	static async init( page ) {
		const it = new this( page );
		await it.waitForPage();
		return it;
	}

	/**
	 *
	 * @param {page} page Playwright type representation of the page
	 * @param {string} pageURL Page URL
	 */
	static async visit( page, pageURL = undefined ) {
		const it = new this( page );
		const url = pageURL ? pageURL : it.url;
		await it.goto( url );

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

/**
 * Internal dependencies
 */
import PageActions from './PageActions';

export default class WpPage extends PageActions {
	constructor( page, { pageName, expectedSelectors, url = undefined, explicitWaitMS = null } ) {
		super( page, pageName, expectedSelectors, explicitWaitMS );
		this.url = url;
	}

	/**
	 * Static method which initialize a page object and checks the page loaded
	 *
	 * @param {page}    page           Playwright representation of the page.
	 * @param {boolean} checkSelectors whether to also check for expected selectors
	 * @return {WpPage} Instance of the Page Object class
	 */
	static async init( page, checkSelectors = true ) {
		const it = new this( page );
		await it.waitForPage( checkSelectors );
		return it;
	}

	/**
	 * @param {page}    page           Playwright type representation of the page
	 * @param {boolean} checkSelectors whether to also check for expected selectors
	 */
	static async visit( page, checkSelectors = true ) {
		const it = new this( page );
		await it.goto( it.url );

		return this.init( page, checkSelectors );
	}

	/**
	 * @param {page}    page           Playwright type representation of the page
	 */
	static async close( page) {
		await page.close( );
	}
}

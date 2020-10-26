/**
 * Internal dependencies
 */
import { waitForSelector } from '../page-helper';
import logger from '../logger';

export default class Page {
	constructor( page, { expectedSelector, url = null, explicitWaitMS = 25000 } ) {
		this.page = page;
		this.expectedSelector = expectedSelector;
		this.visit = false;
		this.url = url;
		this.name = this.constructor.name;
		this.explicitWaitMS = explicitWaitMS;
	}

	/**
	 * Static method which initialize a page object. Also waits for `this.expectedSelector` to become visible, which kinda simulates page loads
	 *
	 * @param {page} page Puppeteer representation of the page.
	 *
	 * @return {Page} Instance of the Page Object class
	 */
	static async init( page ) {
		const it = new this( page );
		await it.waitForPage();
		return it;
	}

	/**
	 *
	 * @param {page} page Puppeteer representation of the page
	 * @param {string} pageURL Page URL
	 */
	static async visit( page, pageURL = null ) {
		const it = new this( page );
		const url = pageURL ? pageURL : it.url;

		if ( ! url ) {
			throw new Error( 'Page URL is not set' );
		}

		logger.info( `${ it.name } navigating to: ${ url }` );
		await page.goto( url );
		return await this.init( page );
	}

	/**
	 * Waits for `this.expectedSelector` to become visible on the page. In debug session logs page HTML if element not found.
	 */
	async waitForPage() {
		await waitForSelector( this.page, this.expectedSelector, {
			visible: true,
			timeout: this.explicitWaitMS,
		} );
	}

	/**
	 * Adds a cookie to the browser and reloads the page.
	 *
	 * @param {string} sandboxCookieValue Cookie to use
	 * @param {string} domain Cookie domain
	 */
	async setSandboxModeForPayments( sandboxCookieValue, domain = '.wordpress.com' ) {
		logger.info( `Setting up the cookie for ${ this.name } page on ${ this.page.url() }` );

		await this.page.setCookie( {
			name: 'store_sandbox',
			value: sandboxCookieValue,
			domain,
		} );

		return await this.reload();
	}

	/**
	 * Reloads the page and waits for the expected locator
	 *
	 * @param {Object} options page.reload options object
	 */
	async reload( options = {} ) {
		await this.page.reload( options );
		return await this.waitForPage();
	}

	async reloadUntil( callback, options = {} ) {
		let reloadNeeded = await callback();
		let count = 1;
		while ( reloadNeeded || count > 5 ) {
			logger.info( 'Reloading since reloadNeeded is: ', reloadNeeded.toString() );

			await this.reload( options );
			reloadNeeded = await callback();
			count++;
		}
	}
}

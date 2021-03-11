import logger from '../logger';

export default class PageActions {
	constructor( page, selectors = [] ) {
		this.page = page;
		this.selectors = selectors;
	}

	// region page functions
	/**
	 * Waits for each of the given selectors to become visible on the page.
	 */
	async waitForPage() {
		logger.action( 'Checking that page is displayed' );
		for ( const selector of this.selectors ) {
			logger.action( `Waiting for element ${ selector } to be visible` );
			await this.page.waitForSelector( selector );
		}
	}

	/**
	 * Reloads the page and waits for the expected locators
	 *
	 * @param {Object} options page.reload options object
	 */
	async reload( options = {} ) {
		logger.action( 'Reloading page' );
		await this.page.reload( options );
		return await this.waitForPage();
	}

	// endregion

	// region actions on page elements

	/**
	 * Click element in page
	 *
	 * @param {string} selector the element's selector
	 * @param {Object} options click options. see: https://playwright.dev/docs/api/class-page#pageclickselector-options
	 * @return {Promise<void>}
	 */
	async click( selector, options = null ) {
		logger.action( `Clicking element ${ selector }` );
		await this.page.click( selector, options );
	}

	/**
	 * Clicks on the element which will open up a new page and waits for that page to load and returns a new page object
	 *
	 * @param {string} selector CSS selector of the element to be clicked
	 * @return {page} New instance of the opened page.
	 */
	async clickAndWaitForNewPage( selector ) {
		const [ newPage ] = await Promise.all( [
			this.page.context().waitForEvent( 'page' ),
			this.page.click( selector ),
		] );

		logger.action( 'Waiting for new page' );
		await newPage.waitForLoadState();
		await newPage.bringToFront();
		return newPage;
	}

	/**
	 * Types text in an element in page
	 *
	 * @param {string} selector the element's selector
	 * @param {string} text to be typed
	 * @param {Object} options click options. see: https://playwright.dev/docs/api/class-page#pagetypeselector-text-options
	 * @return {Promise<void>}
	 */
	async type( selector, text, options = null ) {
		logger.action( `Type into element ${ selector }` );
		await this.page.type( selector, text, options );
	}

	// endregion
}

import logger from '../logger';
import fs from 'fs';
import chalk from 'chalk';

/**
 * This is an abstraction for most important page actions
 * It is supposed to be the base of a page object, extended by any page or page component class
 */
export default class PageActions {
	DEFAULT_TIMEOUT = 30000;

	constructor( page, pageName, selectors = [] ) {
		this.page = page;
		this.selectors = selectors;
		this.pageName = pageName;
	}

	// region page functions

	/**
	 * Navigate to a given URL
	 *
	 * @param {string} url
	 * @param {Object} options object. see: https://playwright.dev/docs/api/class-page?_highlight=goto#pagegotourl-options
	 * @return {Promise<void>}
	 */
	async goto( url, options = null ) {
		if ( ! url ) {
			throw new Error( 'Cannot navigate! Page URL is not set' );
		}
		logger.action( `Navigating to ${ url }` );
		await this.page.goto( url, options );
	}

	/**
	 * Waits for each of the given selectors to become visible on the page.
	 */
	async waitForPage() {
		logger.action( `Checking ${ this.pageName } is displayed` );
		for ( const selector of this.selectors ) {
			await this.waitForElementToBeVisible( selector );
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

	/**
	 * Waits for the given timeout in milliseconds.
	 *
	 * @param {number} timeout A timeout to wait for
	 * @return {Promise<void>}
	 */
	async waitForTimeout( timeout ) {
		logger.action( chalk.redBright( `Waiting for ${ timeout } ms` ) );
		await this.page.waitForTimeout( timeout );
	}

	/**
	 * Saves the current context storage in a local file for later loading in other new contexts
	 *
	 * @return {Promise<void>}
	 */
	async saveCurrentStorageState() {
		const storage = await this.page.context().storageState();
		fs.writeFileSync( 'config/storage.json', JSON.stringify( storage ) );
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
		logger.action( `Clicking element '${ selector }'` );
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
		logger.action( `Type into element '${ selector }'` );
		await this.page.type( selector, text, options );
	}

	/**
	 * Focus an element in page
	 *
	 * @param {string} selector the element's selector
	 * @param {Object} options click options. see: https://playwright.dev/docs/api/class-page?_highlight=focus#pagefocusselector-options
	 * @return {Promise<void>}
	 */
	async focus( selector, options = null ) {
		logger.action( `Focusing on element '${ selector }'` );
		await this.page.focus( selector, options );
	}

	/**
	 * Waits for an element to be visible in a given timeout or throws timeout error
	 * See https://playwright.dev/docs/api/class-page?_highlight=waitforselector#pagewaitforselectorselector-options for what visible means
	 *
	 * @param {string} selector
	 * @param {number} timeout
	 * @return {Promise<*>} Returns the element handler
	 */
	async waitForElementToBeVisible( selector, timeout = this.DEFAULT_TIMEOUT ) {
		return await this.waitForElementState( selector, 'visible', timeout );
	}

	/**
	 * Waits for an element to be attached in a given timeout or throws timeout error
	 *
	 * @param {string} selector
	 * @param {number} timeout
	 * @return {Promise<*>} Returns the element handler
	 */
	async waitForElementToBeAttached( selector, timeout = this.DEFAULT_TIMEOUT ) {
		return await this.waitForElementState( selector, 'attached', timeout );
	}

	/**
	 * Waits for an element to be detached in a given timeout or throws timeout error
	 *
	 * @param {string} selector
	 * @param {number} timeout
	 * @return {Promise<*>} Returns null
	 */
	async waitForElementToBeDetached( selector, timeout = this.DEFAULT_TIMEOUT ) {
		return await this.waitForElementState( selector, 'detached', timeout );
	}

	/**
	 * Waits for an element to be hidden in a given timeout or throws timeout error
	 * See https://playwright.dev/docs/api/class-page?_highlight=waitforselector#pagewaitforselectorselector-options for what hidden means
	 *
	 * @param {string} selector
	 * @param {number} timeout
	 * @return {Promise<*>} Returns null
	 */
	async waitForElementToBeHidden( selector, timeout = this.DEFAULT_TIMEOUT ) {
		return await this.waitForElementState( selector, 'hidden', timeout );
	}

	/**
	 * Waits for an element to has the given state in a given timeout or throws timeout error
	 * https://playwright.dev/docs/api/class-page?_highlight=waitforselector#pagewaitforselectorselector-options
	 *
	 * @param {string} selector
	 * @param {string} state - expected element state (visible|attached|detached|hidden)
	 * @param {number} timeout
	 * @return {Promise<*>} Returns element handler or null if waiting for hidden or detached
	 */
	async waitForElementState( selector, state, timeout = this.DEFAULT_TIMEOUT ) {
		logger.action(
			`Waiting for element '${ selector }' to be ${ state } [timeout: ${ timeout } ms]`
		);
		return await this.page.waitForSelector( selector, { state, timeout } );
	}

	/**
	 * Returns whether an element with the given selector is visible.
	 *
	 * @param {string} selector
	 * @param {number} timeout
	 * @return {Promise<boolean>} true if element is visible, false otherwise
	 */
	async isElementVisible( selector, timeout = this.DEFAULT_TIMEOUT ) {
		logger.action( `Checking if element '${ selector }' is visible` );
		return await this.page.isVisible( selector, { timeout } );
	}

	/**
	 * See https://playwright.dev/docs/api/class-elementhandle?_highlight=selectoption#elementhandleselectoptionvalues-options
	 *
	 * @param {string} selector
	 * @param {Object} values - can be null|string|ElementHandle|Array<string>|Object|Array<ElementHandle>|Array<Object>
	 * @param {Object} options
	 * @return {Promise<void>}
	 */
	async selectOption( selector, values, options = {} ) {
		logger.action( `Selecting '${ values }' in '${ selector }'` );
		await this.page.selectOption( selector, values, options );
	}

	/**
	 * This method hovers over an element matching selector
	 *
	 * @param {string} selector
	 * @param {Object} options see https://playwright.dev/docs/api/class-page?_highlight=hover#pagehoverselector-options
	 * @return {Promise<void>}
	 */
	async hover( selector, options = {} ) {
		logger.action( `Hovering over '${ selector }' element` );
		await this.page.selectOption( selector, options );
	}

	// endregion
}

import logger from '../logger.js';
import chalk from 'chalk';
import config from 'config';
import pwConfig from '../playwright.config.mjs';

/**
 * This is an abstraction for most important page actions
 * It is supposed to be the base of a page object, extended by any page or page component class
 */
export default class PageActions {
	/**
	 * @type {import('@playwright/test').PlaywrightTestArgs['page']} The page instance
	 */
	page;
	constructor( page, pageName, selectors, timeoutOverride = null ) {
		this.page = page;
		this.selectors = selectors;
		this.pageName = pageName ? pageName : this.constructor.name;
		this.timeout = timeoutOverride ? timeoutOverride : pwConfig.use.actionTimeout;
	}

	// region page functions

	/**
	 * Navigate to a given URL
	 *
	 * @param {string} url
	 * @param {Object} options object. see: https://playwright.dev/docs/api/class-page?_highlight=goto#pagegotourl-options
	 * @return {Promise<void>}
	 */
	async goto( url, options = { waitUntil: 'domcontentloaded' } ) {
		if ( ! url ) {
			throw new Error( 'Cannot navigate! Page URL is not set' );
		}

		logger.action( `Navigating to ${ url }` );

		let response;
		try {
			response = await this.page.goto( url, options );
		} catch ( e ) {
			logger.error( `Error navigating to ${ url } (1). Retrying once.\n${ e }` );
			response = await this.page.goto( url, options );
		}

		return response;
	}

	/**
	 * Waits for DOM content load and the for each of the given selectors to become visible on the page.
	 *
	 * @param {boolean} checkSelectors whether to check for expected selectors
	 */
	async waitForPage( checkSelectors = true ) {
		logger.action( `Waiting for ${ this.pageName }` );

		try {
			await this.waitForDomContentLoaded();
		} catch ( e ) {
			logger.error( `Error waiting for domcontentloaded (1): ${ e }` );
			await this.page.reload();
			await this.waitForDomContentLoaded();
		}

		if ( checkSelectors && this.selectors ) {
			for ( const selector of this.selectors ) {
				await this.waitForElementToBeVisible( selector );
			}
		}
	}

	/**
	 * Reloads the page and waits for page to be loaded
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
	 * TODO: Deprecate and remove this, see https://github.com/playwright-community/eslint-plugin-playwright/blob/main/docs/rules/no-wait-for-timeout.md
	 *
	 * @param {number} timeout A timeout to wait for in milliseconds
	 * @return {Promise<void>}
	 */
	async waitForTimeout( timeout ) {
		logger.action( chalk.redBright( `Waiting for ${ timeout } ms` ) );
		// eslint-disable-next-line playwright/no-wait-for-timeout
		await this.page.waitForTimeout( timeout );
	}

	/**
	 * Waits for page to reach the 'networkidle' load state or timeout in given ms
	 *
	 * TODO: Deprecate and remove this, see https://github.com/playwright-community/eslint-plugin-playwright/blob/main/docs/rules/no-networkidle.md
	 *
	 * @param {number} timeout
	 * @return {Promise<void>}
	 */
	async waitForNetworkIdle( timeout = this.timeout ) {
		// eslint-disable-next-line playwright/no-networkidle
		await this.waitForLoadState( 'networkidle', timeout );
	}

	/**
	 * Waits for page to reach the 'load' load state or timeout in given ms
	 *
	 * @param {number} timeout
	 * @return {Promise<void>}
	 */
	async waitForLoad( timeout = this.timeout ) {
		await this.waitForLoadState( 'load', timeout );
	}

	/**
	 * Waits for page to reach the 'domcontentloaded' load state or timeout in given ms
	 *
	 * @param {number} timeout
	 * @return {Promise<void>}
	 */
	async waitForDomContentLoaded( timeout = this.timeout ) {
		await this.waitForLoadState( 'domcontentloaded', timeout );
	}

	/**
	 * Waits for page to reach the given load state or timeout in given ms
	 * https://playwright.dev/docs/api/class-page?_highlight=waitforlo#pagewaitforloadstatestate-options
	 *
	 * @param {string} state
	 * @param {number} timeout
	 * @return {Promise<void>}
	 */
	async waitForLoadState( state, timeout ) {
		logger.action( `Waiting for '${ state }' load state [timeout: ${ timeout } ms]` );
		await this.page.waitForLoadState( state, timeout );
	}

	/**
	 * Saves the current context storage in a local file for later loading in other new contexts
	 *
	 * @return {Promise<void>}
	 */
	async saveCurrentStorageState() {
		await this.page.context().storageState( { path: config.get( 'temp.storage' ) } );
		// fs.writeFileSync( config.get( 'temp.storage' ), JSON.stringify( storage ) );
	}

	/**
	 * Adds a cookie to browser and reloads the page
	 *
	 * @param {Object} cookie the cookie object
	 * @return {Promise<void>}
	 */
	async setCookie( cookie ) {
		logger.step( `Setting cookie ${ JSON.stringify( cookie ) }` );

		await this.page.context().addCookies( [ cookie ] );
		return await this.reload();
	}

	async removeCookieByName( cookieName ) {
		const ctx = this.page.context();
		const allCookies = await ctx.cookies();
		const cookiesWithoutWpcom = allCookies.filter( cookie => cookie.name !== cookieName );
		await ctx.clearCookies();
		await ctx.addCookies( cookiesWithoutWpcom );
	}

	// endregion

	// region actions on page elements

	/**
	 * Click element in page
	 *
	 * @param {string} selector the element's selector
	 * @param {Object} options  click options. see: https://playwright.dev/docs/api/class-page#pageclickselector-options
	 * @return {Promise<void>}
	 */
	async click( selector, options = {} ) {
		logger.action( `Clicking element '${ selector }'` );
		await this.page.click( selector, options );
	}

	/**
	 * Clicks on the element which will open up a new page and waits for that page to load and returns a new page object
	 *
	 * @param {string} selector CSS selector of the element to be clicked
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
	 * Clear element's text by typing ''
	 *
	 * @param {string} selector the element's selector
	 * @return {Promise<void>}
	 */
	async clear( selector ) {
		logger.action( `Clearing text value for element ${ selector }` );
		await this.page.press( selector, 'Control+ArrowRight' );
	}

	/**
	 * Types text in an element in page, can be used to send fine-grained keyboard events.
	 * Do not used for form filling. See `fill` method for that.
	 *
	 * @param {string} selector the element's selector
	 * @param {string} text     to be typed
	 * @param {Object} options  click options. see: https://playwright.dev/docs/api/class-page#pagetypeselector-text-options
	 * @return {Promise<void>}
	 */
	async type( selector, text, options = {} ) {
		logger.action( `Typing into element '${ selector }'` );
		await this.clear( selector );
		await this.page.type( selector, text, options );
	}

	/**
	 * Fills an editable text type element.
	 * It waits for actionability checks before filling
	 *
	 * @param {string} selector the element's selector
	 * @param {string} text     to be filled in
	 * @param {Object} options  see: https://playwright.dev/docs/api/class-page/#pagefillselector-value-options
	 * @return {Promise<void>}
	 */
	async fill( selector, text, options = {} ) {
		logger.action( `Filling element '${ selector }'` );
		await this.page.fill( selector, text, options );
	}

	/**
	 * Focus an element in page.
	 *
	 * @param {string} selector the element's selector
	 * @param {Object} options  see: https://playwright.dev/docs/api/class-page?_highlight=focus#pagefocusselector-options
	 * @return {Promise<void>}
	 */
	async focus( selector, options = {} ) {
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
	async waitForElementToBeVisible( selector, timeout = this.timeout ) {
		return await this.waitForElementState( selector, 'visible', timeout );
	}

	/**
	 * Waits for an element to be attached in a given timeout or throws timeout error
	 *
	 * @param {string} selector
	 * @param {number} timeout
	 * @return {Promise<*>} Returns the element handler
	 */
	async waitForElementToBeAttached( selector, timeout = this.timeout ) {
		return await this.waitForElementState( selector, 'attached', timeout );
	}

	/**
	 * Waits for an element to be detached in a given timeout or throws timeout error
	 *
	 * @param {string} selector
	 * @param {number} timeout
	 * @return {Promise<*>} Returns null
	 */
	async waitForElementToBeDetached( selector, timeout = this.timeout ) {
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
	async waitForElementToBeHidden( selector, timeout = this.timeout ) {
		return await this.waitForElementState( selector, 'hidden', timeout );
	}

	/**
	 * Waits for an element to has the given state in a given timeout or throws timeout error
	 * https://playwright.dev/docs/api/class-page?_highlight=waitforselector#pagewaitforselectorselector-options
	 *
	 * @param {string} selector
	 * @param {string} state    - expected element state (visible|attached|detached|hidden)
	 * @param {number} timeout
	 * @return {Promise<*>} Returns element handler or null if waiting for hidden or detached
	 */
	async waitForElementState( selector, state, timeout = this.timeout ) {
		logger.action(
			`Waiting for element '${ selector }' to be ${ state } [timeout: ${ timeout } ms]`
		);
		const element = this.page.locator( selector ).first();
		await element.waitFor( { state, timeout } );
		return element;
	}

	/**
	 * Returns whether an element with the given selector is visible.
	 *
	 * @param {string} selector
	 * @param {number} timeout
	 * @return {Promise<boolean>} true if at least one element with the given selector is visible, false otherwise
	 */
	async isElementVisible( selector, timeout = this.timeout ) {
		logger.action( `Checking if element '${ selector }' is visible` );
		try {
			await this.page.locator( selector ).first().waitFor( { timeout } );
			return true;
		} catch ( e ) {
			logger.warn( `Element '${ selector }' was not visible. Waited for ${ timeout }ms` );
			return false;
		}
	}

	/**
	 * See https://playwright.dev/docs/api/class-elementhandle?_highlight=selectoption#elementhandleselectoptionvalues-options
	 *
	 * @param {string} selector
	 * @param {Object} values   - can be null|string|ElementHandle|Array<string>|Object|Array<ElementHandle>|Array<Object>
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
	 * @param {Object} options  see https://playwright.dev/docs/api/class-page?_highlight=hover#pagehoverselector-options
	 * @return {Promise<void>}
	 */
	async hover( selector, options = {} ) {
		logger.action( `Hovering over '${ selector }' element` );
		await this.page.hover( selector, options );
	}

	/**
	 * Returns whether an element with the given selector is checked.
	 *
	 * @param {string} selector
	 * @param {number} timeout
	 * @return {Promise<boolean>} true if element is checked, false otherwise
	 */
	async isElementChecked( selector, timeout = this.timeout ) {
		logger.action( `Checking if element '${ selector }' is checked` );
		return await this.page.isChecked( selector, { timeout } );
	}

	// endregion
}

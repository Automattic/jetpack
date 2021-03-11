/**
 * External dependencies
 */
import config from 'config';
/**
 * Internal dependencies
 */
import logger from './logger';

/**
 * Waits for element to be visible, returns false if element was not found after timeout.
 *
 * @param {page} page Playwright representation of the page.
 * @param {string} selector CSS selector of the element
 * @param {number} timeout Amount of time to wait for element
 *
 * @return {boolean} true if visible, false if not
 */
export async function isEventuallyVisible( page, selector, timeout = 5000 ) {
	const isVisible = await isEventuallyPresent( page, selector, {
		state: 'visible',
		timeout,
	} );
	if ( ! isVisible ) {
		logger.info( `Element is not visible by locator: ${ selector }` );
	}
	return isVisible;
}

/**
 * Waits for element to be present, returns false if element was not found after timeout.
 * A bit low level than `isEventuallyVisible`, which allows to wait for an element to appear in DOM but not visible yet,
 *
 * @param {page} page Playwright representation of the page.
 * @param {string} selector CSS selector of the element
 * @param {Object} options Custom options to modify wait behavior.
 *
 * @return {boolean} true if element is present, false if not
 */
export async function isEventuallyPresent( page, selector, options = {} ) {
	const defaultOptions = { timeout: 5000, logHTML: false };
	options = Object.assign( defaultOptions, options );
	try {
		return !! ( await page.waitForSelector( selector, options ) );
	} catch ( e ) {
		return false;
	}
}

/**
 * Extracts a `accountName` configuration from the config file.
 *
 * @param {string} accountName one of the keys of `testAccounts` entry in config file
 *
 * @return {Array} username and password
 */
export function getAccountCredentials( accountName ) {
	const globalConfig = config.get( 'testAccounts' );
	if ( globalConfig.has( 'testAccounts' ) ) {
		throw new Error( `${ accountName } not found in config file` );
	}

	return globalConfig.get( accountName );
}

/**
 * Clicks on the element which will open up a new page, waits for that page to open and returns a new page
 *
 * @param {page} page Playwright representation of the page.
 * @param {string} selector CSS selector of the element
 * @return {page} New instance of the opened page.
 */
export async function clickAndWaitForNewPage( page, selector ) {
	const [ newPage ] = await Promise.all( [
		context.waitForEvent( 'page' ),
		page.click( selector ), // Opens in a new tab
	] );

	await newPage.waitForLoadState();
	await newPage.bringToFront();
	return newPage;
}

/**
 * Scroll the element into view
 *
 * @param {page} page Playwright representation of the page.
 * @param {string} selector CSS selector of the element
 */
export async function scrollIntoView( page, selector ) {
	await page.waitForSelector( selector );
	return await page.evaluate( s => document.querySelector( s ).scrollIntoView(), selector );
}

export async function logHTML() {
	const bodyHTML = await page.evaluate( () => document.body.innerHTML );
	if ( process.env.E2E_DEBUG ) {
		logger.info( '#### PAGE HTML ####' );
		logger.info( page.url() );
		logger.info( bodyHTML );
	}
	logger.slack( { message: bodyHTML, type: 'debuglog' } );
	return bodyHTML;
}

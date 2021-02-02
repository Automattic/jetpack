/**
 * External dependencies
 */
import config from 'config';
/**
 * WordPress dependencies
 */
import { pressKeyWithModifier } from '@wordpress/e2e-test-utils';
/**
 * Internal dependencies
 */
import logger from './logger';
import { execSyncShellCommand } from './utils-helper';

/**
 * Waits for selector to be present in DOM. Throws a `TimeoutError` if element was not found after 30 sec. Behavior can be modified with @param options. Possible keys: `visible`, `hidden`, `timeout`.
 * More details at: https://pptr.dev/#?product=Puppeteer&show=api-pagewaitforselectorselector-options
 *
 * @param {page} page Puppeteer representation of the page.
 * @param {string} selector CSS selector of the element
 * @param {Object} options Custom options to modify function behavior.
 */
export async function waitForSelector( page, selector, options = {} ) {
	const startTime = new Date();
	const { PUPPETEER_HEADLESS } = process.env;

	// set up default options
	const defaultOptions = { timeout: 30000, logHTML: false };
	options = Object.assign( defaultOptions, options );

	try {
		const element = await page.waitForSelector( selector, options );
		const secondsPassed = ( new Date() - startTime ) / 1000;
		logger.info( `Found element by locator: ${ selector }. Waited for: ${ secondsPassed } sec` );
		return element;
	} catch ( e ) {
		if ( options.logHTML && PUPPETEER_HEADLESS !== 'false' ) {
			await logHTML();
		}
		const secondsPassed = ( new Date() - startTime ) / 1000;
		logger.info(
			`Failed to locate an element by locator: ${ selector }. Waited for: ${ secondsPassed } sec. URL: ${ page.url() }`
		);
		throw e;
	}
}

/**
 * Waits for element to be present and visible in DOM, and then clicks on it. @param options could be used to modify click behavior.
 * More: https://pptr.dev/#?product=Puppeteer&version=v1.17.0&show=api-elementhandleclickoptions
 *
 * @param {page} page Puppeteer representation of the page.
 * @param {string} selector CSS selector of the element
 * @param {Object} options Custom options to modify function behavior.
 */
export async function waitAndClick( page, selector, options = { visible: true } ) {
	await waitForSelector( page, selector, options );

	try {
		await page.click( selector, options );
		logger.info( `Clicked on element by locator: ${ selector }.` );
	} catch ( e ) {
		logger.info( `Failed to click on element by locator: ${ selector }. URL: ${ page.url() }` );
		throw e;
	}
}

/**
 * Waits for element to be present in DOM, removes all the previous content and types @param value into the element.
 *
 * @param {page} page Puppeteer representation of the page.
 * @param {string} selector CSS selector of the element
 * @param {string} value Value to type into
 * @param {Object} options Custom options to modify function behavior. The same object passes in two different functions. Use with caution!
 */
export async function waitAndType( page, selector, value, options = { visible: true, delay: 1 } ) {
	const el = await waitForSelector( page, selector, options );

	try {
		await page.focus( selector );
		await pressKeyWithModifier( 'primary', 'a' );
		// await el.click( { clickCount: 3 } );
		await page.waitForTimeout( 300 );
		await el.type( value, options );
		logger.info( `Typed into element with locator: ${ selector }.` );
	} catch ( e ) {
		logger.info( `Failed to type into element with locator: ${ selector }. URL: ${ page.url() }` );
		throw e;
	}
}

/**
 * Waits for element to be visible, returns false if element was not found after timeout.
 *
 * @param {page} page Puppeteer representation of the page.
 * @param {string} selector CSS selector of the element
 * @param {number} timeout Amount of time to wait for element
 *
 * @return {boolean} true if visible, false if not
 */
export async function isEventuallyVisible( page, selector, timeout = 5000 ) {
	const isVisible = await isEventuallyPresent( page, selector, {
		visible: true,
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
 * @param {page} page Puppeteer representation of the page.
 * @param {string} selector CSS selector of the element
 * @param {Object} options Custom options to modify wait behavior.
 *
 * @return {boolean} true if element is present, false if not
 */
export async function isEventuallyPresent( page, selector, options = {} ) {
	const defaultOptions = { timeout: 5000, logHTML: false };
	options = Object.assign( defaultOptions, options );
	try {
		return !! ( await waitForSelector( page, selector, options ) );
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
 * @param {page} page Puppeteer representation of the page.
 * @param {string} selector CSS selector of the element
 * @return {page} New instance of the opened page.
 */
export async function clickAndWaitForNewPage( page, selector ) {
	const newTabTarget = new Promise( resolve => {
		const listener = async target => {
			if ( target.type() === 'page' ) {
				browser.removeListener( 'targetcreated', listener );
				resolve( target );
			}
		};
		browser.addListener( 'targetcreated', listener );
	} );

	await waitAndClick( page, selector );
	const target = await newTabTarget;
	const newPage = await target.page();
	await newPage.bringToFront();
	return newPage;
}

/**
 * Scroll the element into view
 *
 * @param {page} page Puppeteer representation of the page.
 * @param {string} selector CSS selector of the element
 */
export async function scrollIntoView( page, selector ) {
	await waitForSelector( page, selector );
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

export async function logDebugLog() {
	let log = execSyncShellCommand( 'yarn wp-env run tests-wordpress cat wp-content/debug.log' );
	const lines = log.split( '\n' );
	log = lines
		.filter( line => {
			if ( line.startsWith( '$ ' ) || line.includes( 'yarn run' ) || line.includes( 'Done ' ) ) {
				return false;
			}
			return true;
		} )
		.join( '\n' );

	if ( log.length > 1 ) {
		if ( process.env.E2E_DEBUG ) {
			logger.info( '#### WP DEBUG.LOG ####' );
			logger.info( log );
		}
		logger.slack( { message: log, type: 'debuglog' } );
	}

	const apacheLog = execSyncShellCommand( 'yarn wp-env logs tests --watch=false' );
	logger.slack( { type: 'debuglog', message: apacheLog } );
}

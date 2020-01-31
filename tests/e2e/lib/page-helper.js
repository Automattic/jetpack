/**
 * External dependencies
 */
import config from 'config';
/**
 * WordPress dependencies
 */
import { pressKeyWithModifier } from '@wordpress/e2e-test-utils';
import { readFileSync } from 'fs';
/**
 * Internal dependencies
 */
import { sendSnippetToSlack } from './reporters/slack';

/**
 * Waits for selector to be present in DOM. Throws a `TimeoutError` if element was not found after 30 sec. Behavior can be modified with @param options. Possible keys: `visible`, `hidden`, `timeout`.
 * More details at: https://pptr.dev/#?product=Puppeteer&show=api-pagewaitforselectorselector-options
 *
 * @param {Puppeteer.Page} page Puppeteer representation of the page.
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
		console.log( `Found element by locator: ${ selector }. Waited for: ${ secondsPassed } sec` );
		return element;
	} catch ( e ) {
		if ( options.logHTML && PUPPETEER_HEADLESS !== 'false' ) {
			await logHTML();
		}
		const secondsPassed = ( new Date() - startTime ) / 1000;
		console.log(
			`Failed to locate an element by locator: ${ selector }. Waited for: ${ secondsPassed } sec. URL: ${ page.url() }`
		);
		throw e;
	}
}

/**
 * Waits for element to be present and visible in DOM, and then clicks on it. @param options could be used to modify click behavior.
 * More: https://pptr.dev/#?product=Puppeteer&version=v1.17.0&show=api-elementhandleclickoptions
 *
 * @param {Puppeteer.Page} page Puppeteer representation of the page.
 * @param {string} selector CSS selector of the element
 * @param {Object} options Custom options to modify function behavior.
 */
export async function waitAndClick( page, selector, options = { visible: true } ) {
	const element = await waitForSelector( page, selector, options );
	return await element.click( options );
}

/**
 * Waits for element to be present in DOM, removes all the previous content and types @param value into the element.
 * @param {Puppeteer.Page} page Puppeteer representation of the page.
 * @param {string} selector CSS selector of the element
 * @param {string} value Value to type into
 * @param {Object} options Custom options to modify function behavior. The same object passes in two different functions. Use with caution!
 */
export async function waitAndType( page, selector, value, options = { visible: true } ) {
	const el = await waitForSelector( page, selector, options );
	await page.focus( selector );
	await pressKeyWithModifier( 'primary', 'a' );
	// await el.click( { clickCount: 3 } );
	await page.waitFor( 300 );
	await el.type( value, options );
}

/**
 * Waits for element to be visible, returns false if element was not found after timeout.
 *
 * @param {Puppeteer.Page} page Puppeteer representation of the page.
 * @param {string} selector CSS selector of the element
 * @param {number} timeout Amount of time to wait for element
 *
 * @return {boolean} true if visible, false if not
 */
export async function isEventuallyVisible( page, selector, timeout = 5000 ) {
	const isVisible = await isEventuallyPresent( page, selector, { visible: true, timeout } );
	if ( ! isVisible ) {
		console.log( `Element is not visible by locator: ${ selector }` );
	}
	return isVisible;
}

/**
 * Waits for element to be present, returns false if element was not found after timeout.
 * A bit low level than `isEventuallyVisible`, which allows to wait for an element to appear in DOM but not visible yet,
 *
 * @param {Puppeteer.Page} page Puppeteer representation of the page.
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
 * @param {Puppeteer.Page} page Puppeteer representation of the page.
 * @param {string} selector CSS selector of the element
 * @param {number} timeout Wait timeout
 *
 * @return {Puppeteer.Page} New instance of the opened page.
 */
export async function clickAndWaitForNewPage( page, selector, timeout = 25000 ) {
	// Create a promise that rejects in <ms> milliseconds
	const timeoutPromise = new Promise( ( resolve, reject ) => {
		const id = setTimeout( () => {
			clearTimeout( id );
			reject( 'Timed out in ' + timeout + 'ms.' );
		}, timeout );
	} );
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

	const target = await Promise.race( [ newTabTarget, timeoutPromise ] );
	return await target.page();
}

/**
 * Scroll the element into view
 *
 * @param {Puppeteer.Page} page Puppeteer representation of the page.
 * @param {string} selector CSS selector of the element
 */
export async function scrollIntoView( page, selector ) {
	await waitForSelector( page, selector );
	return await page.evaluate( s => document.querySelector( s ).scrollIntoView(), selector );
}

export async function logHTML() {
	const bodyHTML = await page.evaluate( () => document.body.innerHTML );
	if ( process.env.E2E_DEBUG ) {
		console.log( '#### PAGE HTML ####' );
		console.log( page.url() );
		console.log( bodyHTML );
	}
	await sendSnippetToSlack( bodyHTML );
	return bodyHTML;
}

export async function logDebugLog() {
	const log = readFileSync( '/home/travis/wordpress/wp-content/debug.log' ).toString();
	if ( log.length > 1 ) {
		if ( process.env.E2E_DEBUG ) {
			console.log( '#### WP DEBUG.LOG ####' );
			console.log( log );
		}
		await sendSnippetToSlack( log );
	}
}

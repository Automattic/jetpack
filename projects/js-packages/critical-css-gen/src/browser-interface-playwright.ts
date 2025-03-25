import { BrowserContext, Page } from 'playwright-core';
import { BrowserInterface, BrowserRunnable, FetchOptions } from './browser-interface.js';
import { HttpError } from './errors.js';
import { objectPromiseAll } from './object-promise-all.js';
import { Viewport } from './types.js';

export type Tab = { page: Page; statusCode: number | null };
export type TabsByUrl = { [ url: string ]: Tab };

const PAGE_GOTO_TIMEOUT_MS = 5 * 60 * 1000;

export class BrowserInterfacePlaywright extends BrowserInterface {
	private tabs: TabsByUrl;

	/**
	 * Creates a new BrowserInterfacePlaywright instance.
	 *
	 * @param {BrowserContext} context - The playwright browser context to work with.
	 * @param {string[]}       urls    - Array of urls to evaluate. The reason we are taking this as an argument is because we want to load all of them in parallel.
	 */
	constructor(
		private context: BrowserContext,
		private urls: string[]
	) {
		super();
	}

	async cleanup() {
		if ( this.tabs ) {
			await Promise.all(
				Object.values( this.tabs ).map( tab => tab.page.close().catch( () => {} ) )
			);
		}
		this.tabs = undefined;
	}

	private async getTabs() {
		if ( typeof this.tabs === 'undefined' ) {
			await this.openUrls( this.context, this.urls );
		}

		return this.tabs;
	}

	/**
	 * Open an array of urls in a new browser context.
	 *
	 * Take a browser instance and an array of urls to open in new tabs.
	 *
	 * @param {BrowserContext} context - Browser context to use.
	 * @param {string[]}       urls    - Array of urls to open.
	 * @return {Promise< TabsByUrl >} Promise resolving to the browser context.
	 */
	private async openUrls( context: BrowserContext, urls: string[] ): Promise< void > {
		this.tabs = await objectPromiseAll< Tab >(
			urls.reduce( ( set, url ) => {
				set[ url ] = this.newTab( context, url );
				return set;
			}, {} )
		);
	}

	/**
	 * Open url in a new tab in a given browserContext.
	 *
	 * @param {BrowserContext} browserContext - Browser context to use.
	 * @param {string}         url            - Url to open.
	 * @return {Promise<Page>} Promise resolving to the page instance.
	 */
	private async newTab( browserContext: BrowserContext, url: string ): Promise< Tab > {
		const page = await browserContext.newPage();
		try {
			const tab = {
				page,
				statusCode: null,
			};

			tab.page.on( 'response', async response => {
				if ( response.url() === url ) {
					tab.statusCode = response.status();
				}
			} );

			await tab.page.goto( url, { timeout: PAGE_GOTO_TIMEOUT_MS } );
			return tab;
		} catch ( error ) {
			await page.close().catch( () => {} ); // Cleanup on error
			throw error;
		}
	}

	async runInPage< ReturnType >(
		pageUrl: string,
		viewport: Viewport | null,
		method: BrowserRunnable< ReturnType >,
		...args: unknown[]
	): Promise< ReturnType > {
		const tabs = await this.getTabs();
		const tab = tabs[ pageUrl ];

		if ( ! tab || ! tab.page ) {
			throw new Error( `Playwright interface does not include URL ${ pageUrl }` );
		}

		// Bail early if the page returned a non-200 status code.
		if ( ! tab.statusCode || ! this.isOkStatus( tab.statusCode ) ) {
			const error = new HttpError( { url: pageUrl, code: tab.statusCode } );
			this.trackUrlError( pageUrl, error );
			throw error;
		}

		if ( viewport ) {
			await tab.page.setViewportSize( viewport );
		}

		// The inner window in Playwright is the directly accessible main window object.
		// The evaluating method does not need a separate window object.
		// Call inner method within the Playwright context.
		return tab.page.evaluate( method, { innerWindow: null, args } );
	}

	/**
	 * Replacement for browser.fetch, uses node's fetch to simulate the same
	 * interface.
	 *
	 * @param {string} url     - URL to fetch.
	 * @param {object} options - Fetch options.
	 * @param {string} _role   - 'css' or 'html' indicating what kind of thing is being fetched.
	 * @return {Promise<Response>} A promise that resolves to the fetch response.
	 */
	async fetch( url: string, options: FetchOptions, _role: 'css' | 'html' ) {
		return fetch( url, options );
	}

	private isOkStatus( statusCode: number ) {
		return statusCode >= 200 && statusCode < 300;
	}
}

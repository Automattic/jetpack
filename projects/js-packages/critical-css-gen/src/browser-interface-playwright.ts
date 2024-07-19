import { Viewport } from './types';
import { BrowserInterface, BrowserRunnable, FetchOptions } from './browser-interface';
import { HttpError } from './errors';
import { BrowserContext, Page } from 'playwright-core';
import { objectPromiseAll } from './object-promise-all';

export type Tab = { page: Page; statusCode: number | null };
export type TabsByUrl = { [ url: string ]: Tab };

const PAGE_GOTO_TIMEOUT_MS = 5 * 60 * 1000;

export class BrowserInterfacePlaywright extends BrowserInterface {
	private tabs: TabsByUrl;

	/**
	 *
	 * @param context The playwright browser context to work with.
	 * @param urls    Array of urls to evaluate. The reason we are taking this as an argument is because we want to load all of them in parallel.
	 */
	constructor(
		private context: BrowserContext,
		private urls: string[]
	) {
		super();
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
		const tab = {
			page: await browserContext.newPage(),
			statusCode: null,
		};
		tab.page.on( 'response', async response => {
			if ( response.url() === url ) {
				tab.statusCode = response.status();
			}
		} );

		await tab.page.goto( url, { timeout: PAGE_GOTO_TIMEOUT_MS } );

		return tab;
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
	 * Replacement for browser.fetch, uses node-fetch to simulate the same
	 * interface.
	 *
	 * @param {string} url     URL to fetch.
	 * @param {Object} options Fetch options.
	 * @param {string} _role   'css' or 'html' indicating what kind of thing is being fetched.
	 */
	async fetch( url: string, options: FetchOptions, _role: 'css' | 'html' ) {
		const nodeFetch = await import( 'node-fetch' );

		return nodeFetch.default( url, options );
	}

	private isOkStatus( statusCode: number ) {
		return statusCode >= 200 && statusCode < 300;
	}
}

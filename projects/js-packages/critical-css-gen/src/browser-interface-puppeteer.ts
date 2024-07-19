import { Viewport } from './types';
import { BrowserInterface, BrowserRunnable, FetchOptions } from './browser-interface';

interface Page {
	setViewport( viewport: Viewport ): Promise< void >;
	// eslint-disable-next-line @typescript-eslint/ban-types
	evaluate( method: string | Function, arg: Record< string, unknown > );
}

export class BrowserInterfacePuppeteer extends BrowserInterface {
	constructor( private pages: { [ url: string ]: Page } ) {
		super();
	}

	async runInPage< ReturnType >(
		pageUrl: string,
		viewport: Viewport | null,
		method: BrowserRunnable< ReturnType >,
		...args: unknown[]
	): Promise< ReturnType > {
		const page = this.pages[ pageUrl ];

		if ( ! page ) {
			throw new Error( `Puppeteer interface does not include URL ${ pageUrl }` );
		}

		if ( viewport ) {
			await page.setViewport( viewport );
		}

		// Get the inner window to pass to inner method.
		// const window = await page.evaluateHandle( () => window );

		// The inner window in Puppeteer is the directly accessible main window object.
		// The evaluating method does not need a separate window object.
		// Call inner method within the Puppeteer context.
		return page.evaluate( method, { innerWindow: null, args } );
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
}

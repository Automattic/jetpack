import { BrowserContext, Page } from 'playwright-core';
import { BrowserInterface, BrowserRunnable, FetchOptions } from './browser-interface.js';
import { Viewport } from './types.js';
export type Tab = {
    page: Page;
    statusCode: number | null;
};
export type TabsByUrl = {
    [url: string]: Tab;
};
export declare class BrowserInterfacePlaywright extends BrowserInterface {
    private context;
    private urls;
    private tabs;
    /**
     * Creates a new BrowserInterfacePlaywright instance.
     *
     * @param {BrowserContext} context - The playwright browser context to work with.
     * @param {string[]}       urls    - Array of urls to evaluate. The reason we are taking this as an argument is because we want to load all of them in parallel.
     */
    constructor(context: BrowserContext, urls: string[]);
    private getTabs;
    /**
     * Open an array of urls in a new browser context.
     *
     * Take a browser instance and an array of urls to open in new tabs.
     *
     * @param {BrowserContext} context - Browser context to use.
     * @param {string[]}       urls    - Array of urls to open.
     * @return {Promise< TabsByUrl >} Promise resolving to the browser context.
     */
    private openUrls;
    /**
     * Open url in a new tab in a given browserContext.
     *
     * @param {BrowserContext} browserContext - Browser context to use.
     * @param {string}         url            - Url to open.
     * @return {Promise<Page>} Promise resolving to the page instance.
     */
    private newTab;
    runInPage<ReturnType>(pageUrl: string, viewport: Viewport | null, method: BrowserRunnable<ReturnType>, ...args: unknown[]): Promise<ReturnType>;
    /**
     * Replacement for browser.fetch, uses node's fetch to simulate the same
     * interface.
     *
     * @param {string} url     - URL to fetch.
     * @param {object} options - Fetch options.
     * @param {string} _role   - 'css' or 'html' indicating what kind of thing is being fetched.
     * @return {Promise<Response>} A promise that resolves to the fetch response.
     */
    fetch(url: string, options: FetchOptions, _role: 'css' | 'html'): Promise<Response>;
    private isOkStatus;
}

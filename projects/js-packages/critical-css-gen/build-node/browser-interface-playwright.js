import { BrowserInterface } from './browser-interface.js';
import { HttpError } from './errors.js';
import { objectPromiseAll } from './object-promise-all.js';
const PAGE_GOTO_TIMEOUT_MS = 5 * 60 * 1000;
export class BrowserInterfacePlaywright extends BrowserInterface {
    /**
     * Creates a new BrowserInterfacePlaywright instance.
     *
     * @param {BrowserContext} context - The playwright browser context to work with.
     * @param {string[]}       urls    - Array of urls to evaluate. The reason we are taking this as an argument is because we want to load all of them in parallel.
     */
    constructor(context, urls) {
        super();
        this.context = context;
        this.urls = urls;
    }
    async getTabs() {
        if (typeof this.tabs === 'undefined') {
            await this.openUrls(this.context, this.urls);
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
    async openUrls(context, urls) {
        this.tabs = await objectPromiseAll(urls.reduce((set, url) => {
            set[url] = this.newTab(context, url);
            return set;
        }, {}));
    }
    /**
     * Open url in a new tab in a given browserContext.
     *
     * @param {BrowserContext} browserContext - Browser context to use.
     * @param {string}         url            - Url to open.
     * @return {Promise<Page>} Promise resolving to the page instance.
     */
    async newTab(browserContext, url) {
        const tab = {
            page: await browserContext.newPage(),
            statusCode: null,
        };
        tab.page.on('response', async (response) => {
            if (response.url() === url) {
                tab.statusCode = response.status();
            }
        });
        await tab.page.goto(url, { timeout: PAGE_GOTO_TIMEOUT_MS });
        return tab;
    }
    async runInPage(pageUrl, viewport, method, ...args) {
        const tabs = await this.getTabs();
        const tab = tabs[pageUrl];
        if (!tab || !tab.page) {
            throw new Error(`Playwright interface does not include URL ${pageUrl}`);
        }
        // Bail early if the page returned a non-200 status code.
        if (!tab.statusCode || !this.isOkStatus(tab.statusCode)) {
            const error = new HttpError({ url: pageUrl, code: tab.statusCode });
            this.trackUrlError(pageUrl, error);
            throw error;
        }
        if (viewport) {
            await tab.page.setViewportSize(viewport);
        }
        // The inner window in Playwright is the directly accessible main window object.
        // The evaluating method does not need a separate window object.
        // Call inner method within the Playwright context.
        return tab.page.evaluate(method, { innerWindow: null, args });
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
    async fetch(url, options, _role) {
        return fetch(url, options);
    }
    isOkStatus(statusCode) {
        return statusCode >= 200 && statusCode < 300;
    }
}
//# sourceMappingURL=browser-interface-playwright.js.map
import type { Viewport } from './types.js';
export type BrowserRunnable<ReturnType> = (arg: unknown) => ReturnType;
export interface FetchOptions {
    method?: 'POST' | 'GET';
}
export interface FetchResponse {
    ok: boolean;
    status: number;
    text: () => Promise<string>;
}
export declare class BrowserInterface {
    private urlErrors;
    constructor();
    trackUrlError(url: string, error: Error): void;
    filterValidUrls(urls: string[]): string[];
    runInPage<ReturnType>(_pageUrl: string, _viewport: Viewport | null, _method: BrowserRunnable<ReturnType>, ..._args: unknown[]): Promise<ReturnType>;
    /**
     * Context-specific wrapper for fetch; uses window.fetch in browsers, or a
     * node library when using Puppeteer.
     *
     * @param {string}         _url     - The URL to fetch
     * @param {FetchOptions}   _options - Fetch options
     * @param {'css' | 'html'} _role    - Role of the fetch operation
     */
    fetch(_url: string, _options: FetchOptions, _role: 'css' | 'html'): Promise<FetchResponse>;
    cleanup(): Promise<void>;
    getCssIncludes(pageUrl: string): Promise<{
        [url: string]: {
            media: string;
        };
    }>;
    static innerGetCssIncludes({ innerWindow }: {
        innerWindow: any;
    }): any;
    getInternalStyles(pageUrl: string): Promise<string>;
    /**
     * Get all internal styles as a combined string from the window.
     *
     * @param {object} wrappedArgs             - Object containing the inner window.
     * @param {Window} wrappedArgs.innerWindow - Window inside the browser interface.
     * @return {string} Combined internal styles as a string.
     */
    static innerGetInternalStyles({ innerWindow }: {
        innerWindow: any;
    }): string;
    /**
     * Given a set of CSS selectors (as object keys), along with "simplified" versions
     * for easy querySelector calling (values), return an array of selectors which match
     * _any_ element on the page.
     *
     * @param {object}   wrappedArgs             - Object containing the inner window and arguments.
     * @param {Window}   wrappedArgs.innerWindow - Window inside the browser interface.
     * @param {Object[]} wrappedArgs.args        - Array of arguments.
     *                                           {Object} wrappedArgs.args[selectors] - Map containing selectors (object keys), and simplified versions for easy matching (values).
     * @return {string[]} Array of selectors matching above-the-fold elements.
     */
    static innerFindMatchingSelectors({ innerWindow, args: [selectors] }: {
        innerWindow: any;
        args: [any];
    }): string[];
    /**
     * Given a set of CSS selectors (as object keys), along with "simplified" versions
     * for easy querySelector calling (values), return an array of selectors which match
     * any above-the-fold element on the page.
     *
     * @param {object}   wrappedArgs             - Object containing the inner window and arguments.
     * @param {Window}   wrappedArgs.innerWindow - Window inside the browser interface.
     * @param {Object[]} wrappedArgs.args        - Array of arguments.
     *                                           {Object} wrappedArgs.args[selectors] - Map containing selectors (object keys), and simplified versions for easy matching (values).
     *                                           {string[]} wrappedArgs.args[pageSelectors] - String array containing selectors that appear anywhere on this page (as returned by innerFindMatchingSelectors) - should be a subset of keys in selectors.
     * @return {string[]} Array of selectors matching above-the-fold elements.
     */
    static innerFindAboveFoldSelectors({ innerWindow, args: [selectors, pageSelectors], }: {
        innerWindow: any;
        args: [any, any];
    }): string[];
}

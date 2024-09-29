import { BrowserInterface } from './browser-interface.js';
import { FilterSpec, Viewport } from './types.js';
/**
 * Generates critical CSS for the given URLs and viewports.
 *
 * @param {object}           root0                  - The options object
 * @param {BrowserInterface} root0.browserInterface - Interface to interact with the browser
 * @param {Function}         root0.progressCallback - Optional callback function to report progress
 * @param {string[]}         root0.urls             - Array of URLs to generate critical CSS for
 * @param {Viewport[]}       root0.viewports        - Array of viewport sizes to consider
 * @param {FilterSpec}       root0.filters          - Optional filters to apply to the CSS
 * @param {number}           root0.successRatio     - Ratio of successful URLs required (default: 1)
 * @param {number}           root0.maxPages         - Maximum number of pages to process (default: 10)
 * @return {Promise<[string, Error[]]>} A promise that resolves to an array containing the critical CSS string and an array of errors.
 */
export declare function generateCriticalCSS({ browserInterface, progressCallback, urls, viewports, filters, successRatio, maxPages, }: {
    browserInterface: BrowserInterface;
    progressCallback?: (step: number, total: number) => void;
    urls: string[];
    viewports: Viewport[];
    filters?: FilterSpec;
    successRatio?: number;
    maxPages?: number;
}): Promise<[string, Error[]]>;

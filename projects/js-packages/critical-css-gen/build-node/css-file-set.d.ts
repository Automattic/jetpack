import { BrowserInterface } from './browser-interface.js';
import { StyleAST } from './style-ast.js';
import { FilterSpec } from './types.js';
type CSSFile = {
    css: string;
    ast: StyleAST;
    pages: string[];
    urls: string[];
};
/**
 * Represents a set of CSS files found on one or more HTML page. Automatically de-duplicates
 * CSS files by URL and by content, and parses each into an Abstract Syntax Tree. Also tracks
 * all errors that occur while loading or parsing CSS.
 */
export declare class CSSFileSet {
    private browserInterface;
    private knownUrls;
    private cssFiles;
    private errors;
    private internalStyles;
    constructor(browserInterface: BrowserInterface);
    /**
     * Add a set of CSS URLs from an HTML page to this set.
     *
     * @param {string} page        - URL of the page the CSS URLs were found on.
     * @param {object} cssIncludes - Included CSS Files. Keyed by URL.
     */
    addMultiple(page: string, cssIncludes: {
        [url: string]: {
            media: string;
        };
    }): Promise<void>;
    addInternalStyles(page: string, internalStyles: string): Promise<void>;
    /**
     * Add a CSS URL from an HTML page to this set.
     *
     * @param {string} page     - URL of the page the CSS URL was found on.
     * @param {string} cssUrl   - The CSS file URL.
     * @param {object} settings - Additional settings for the CSS file.
     */
    add(page: string, cssUrl: string, settings?: {
        [url: string]: string;
    }): Promise<void>;
    /**
     * Collates an object describing the selectors found in the CSS files in this set, and which
     * HTML page URLs include them (via CSS files)
     *
     * @return {object} - An object with selector text keys, each containing a Set of page URLs (strings)
     */
    collateSelectorPages(): {
        [selector: string]: Set<string>;
    };
    /**
     * Applies filters to the properties or atRules in each AST in this set of CSS files.
     * Mutates each AST in-place.
     *
     * @param {FilterSpec} filters - Object containing property and atRule filter functions.
     */
    applyFilters(filters: FilterSpec): void;
    /**
     * Returns a new AST which is pruned appropriately for the specified contentWindow, and the
     * set of selectors that are worth keeping. (i.e.: appear above the fold).
     *
     * @param {Set<string>} usefulSelectors - Set of selectors to keep.
     * @return {StyleAST[]} Array of pruned StyleAST objects.
     */
    prunedAsts(usefulSelectors: Set<string>): StyleAST[];
    /**
     * Internal method: Store the specified css found at the cssUrl for an HTML page,
     * de-duplicating CSS files by content along the way.
     *
     * @param {string} page   - URL of HTML page this CSS file was found on.
     * @param {string} cssUrl - URL of the CSS file.
     * @param {string} css    - Content of the CSS File.
     */
    storeCss(page: string, cssUrl: string, css: string): void;
    /**
     * Internal method: Add an extra reference to a previously known CSS file found either
     * on a new HTML page, or at a new URL.
     *
     * @param {string} page         - URL of the page this CSS file was found on.
     * @param {string} cssUrl       - URL of the CSS File.
     * @param {object} matchingFile - Internal CSS File object.
     */
    addExtraReference(page: string, cssUrl: string, matchingFile: CSSFile): void;
    /**
     * Stores an error that occurred while fetching or parsing CSS at the given URL.
     *
     * @param {string} url - CSS URL that failed to fetch or parse.
     * @param {Error}  err - Error object describing the problem.
     */
    storeError(url: string, err: Error): void;
    /**
     * Returns a list of errors that occurred while fetching or parsing these CSS files.
     *
     * @return {Error[]} - List of errors that occurred.
     */
    getErrors(): Error[];
}
export {};

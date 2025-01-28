import { BrowserInterface } from './browser-interface.js';
import { CSSFileSet } from './css-file-set.js';
import { SuccessTargetError, EmptyCSSError, UrlError } from './errors.js';
import { removeIgnoredPseudoElements } from './ignored-pseudo-elements.js';
import { minifyCss } from './minify-css.js';
import { FilterSpec, Viewport } from './types.js';

const noop = () => {
	// No op.
};

/**
 * Collate and return a CSSFileSet object describing all the CSS files used by
 * the set of URLs provided.
 *
 * Errors that occur during this process are collated, but not thrown yet.
 *
 * @param {BrowserInterface} browserInterface - interface to access pages
 * @param {string[]}         urls             - list of URLs to scan for CSS files
 * @param {number}           maxPages         - number of pages to process at most
 * @return {Array} - Two member array; CSSFileSet, and an object containing errors that occurred at each URL.
 */
async function collateCssFiles(
	browserInterface: BrowserInterface,
	urls: string[],
	maxPages: number
): Promise< [ CSSFileSet, { [ url: string ]: UrlError } ] > {
	const cssFiles = new CSSFileSet( browserInterface );
	const errors = {};
	let successes = 0;

	for ( const url of urls ) {
		try {
			const cssIncludes = await browserInterface.getCssIncludes( url );

			// Convert relative URLs to absolute.
			const relativeUrls = Object.keys( cssIncludes );
			const absoluteIncludes = relativeUrls.reduce(
				( set, relative ) => {
					try {
						const absolute = new URL( relative, url ).toString();
						set[ absolute ] = cssIncludes[ relative ];
					} catch {
						// Ignore invalid URLs.
						// eslint-disable-next-line no-console
						console.log( `Could not absolutify URL: ${ relative }` );
					}

					return set;
				},
				{} as typeof cssIncludes
			);

			await cssFiles.addMultiple( url, absoluteIncludes );

			const internalStyles = await browserInterface.getInternalStyles( url );
			await cssFiles.addInternalStyles( url, internalStyles );

			// Abort early if we hit the critical mass
			successes++;
			if ( successes >= maxPages ) {
				break;
			}
		} catch ( err ) {
			errors[ url ] = err;
		}
	}

	return [ cssFiles, errors ];
}

/**
 * Get CSS selectors for above the fold content for the valid URLs.
 *
 * @param {object}           param                  - All the parameters as object.
 * @param {BrowserInterface} param.browserInterface - Interface to access pages
 * @param {object}           param.selectorPages    - All the CSS selectors to URLs map object
 * @param {string[]}         param.validUrls        - List of all the valid URLs
 * @param {Array}            param.viewports        - Browser viewports
 * @param {number}           param.maxPages         - Maximum number of pages to process
 * @param {Function}         param.updateProgress   - Update progress callback function
 *
 * @return {Set<string>} - List of above the fold selectors.
 */
async function getAboveFoldSelectors( {
	browserInterface,
	selectorPages,
	validUrls,
	viewports,
	maxPages,
	updateProgress,
}: {
	browserInterface: BrowserInterface;
	selectorPages: { [ selector: string ]: Set< string > };
	validUrls: string[];
	viewports: Viewport[];
	maxPages: number;
	updateProgress: () => void;
} ): Promise< Set< string > > {
	// For each selector string, create a "trimmed" version with the stuff JavaScript can't handle cut out.
	const trimmedSelectors = Object.keys( selectorPages ).reduce( ( set, selector ) => {
		set[ selector ] = removeIgnoredPseudoElements( selector );
		return set;
	}, {} );

	// Go through all the URLs looking for above-the-fold selectors, and selectors which may be "dangerous"
	// i.e.: may match elements on pages that do not include their CSS file.
	const aboveFoldSelectors = new Set< string >();
	const dangerousSelectors = new Set< string >();

	for ( const url of validUrls.slice( 0, maxPages ) ) {
		// Work out which CSS selectors match any element on this page.
		const pageSelectors = await browserInterface.runInPage<
			ReturnType< typeof BrowserInterface.innerFindMatchingSelectors >
		>( url, null, BrowserInterface.innerFindMatchingSelectors, trimmedSelectors );

		// Check for selectors which may match this page, but are not included in this page's CSS.
		pageSelectors
			.filter( s => ! selectorPages[ s ].has( url ) )
			.forEach( s => dangerousSelectors.add( s ) );

		// Collate all above-fold selectors for all viewport sizes.
		for ( const size of viewports ) {
			updateProgress();

			const pageAboveFold = await browserInterface.runInPage<
				ReturnType< typeof BrowserInterface.innerFindAboveFoldSelectors >
			>( url, size, BrowserInterface.innerFindAboveFoldSelectors, trimmedSelectors, pageSelectors );

			pageAboveFold.forEach( s => aboveFoldSelectors.add( s ) );
		}
	}

	// Remove dangerous selectors from above fold set.
	for ( const dangerousSelector of dangerousSelectors ) {
		aboveFoldSelectors.delete( dangerousSelector );
	}

	return aboveFoldSelectors;
}

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
export async function generateCriticalCSS( {
	browserInterface,
	progressCallback,
	urls,
	viewports,
	filters,
	successRatio = 1,
	maxPages = 10,
}: {
	browserInterface: BrowserInterface;
	progressCallback?: ( step: number, total: number ) => void;
	urls: string[];
	viewports: Viewport[];
	filters?: FilterSpec;
	successRatio?: number;
	maxPages?: number;
} ): Promise< [ string, Error[] ] > {
	// Success threshold is calculated based on the success ratio of "the number of URLs provided", or "maxPages" whichever is lower.
	// See 268-gh-Automattic/boost-cloud
	const successUrlsThreshold = Math.ceil( Math.min( urls.length, maxPages ) * successRatio );

	try {
		progressCallback = progressCallback || noop;
		let progress = 0;
		const progressSteps = 1 + urls.length * viewports.length;
		const updateProgress = () => progressCallback( ++progress, progressSteps );

		// Collate all CSS Files used by all valid URLs.
		const [ cssFiles, cssFileErrors ] = await collateCssFiles( browserInterface, urls, maxPages );
		updateProgress();

		// Verify there are enough valid URLs to carry on with.
		const validUrls = browserInterface.filterValidUrls( urls );

		if ( validUrls.length < successUrlsThreshold ) {
			throw new SuccessTargetError( cssFileErrors );
		}

		// Trim ignored rules out of all CSS ASTs.
		cssFiles.applyFilters( filters || {} );

		// Gather a record of all selectors, and which page URLs each is referenced by.
		const selectorPages = cssFiles.collateSelectorPages();

		// Get CSS selectors for above the fold.
		const aboveFoldSelectors = await getAboveFoldSelectors( {
			browserInterface,
			selectorPages,
			validUrls,
			viewports,
			maxPages,
			updateProgress,
		} );

		// Prune each AST for above-fold selector list. Note: this prunes a clone.
		const asts = cssFiles.prunedAsts( aboveFoldSelectors );

		// Convert ASTs to CSS.
		const [ css, cssErrors ] = minifyCss( asts.map( ast => ast.toCSS() ).join( '\n' ) );

		// If there is no Critical CSS, it means the URLs did not have any CSS in their external style sheet(s).
		if ( ! css ) {
			const emptyCSSErrors = {};
			for ( const url of validUrls ) {
				emptyCSSErrors[ url ] = new EmptyCSSError( { url } );
			}
			throw new SuccessTargetError( emptyCSSErrors );
		}

		// Collect warnings / errors together.
		const warnings = cssFiles.getErrors().concat( cssErrors.map( s => new Error( s ) ) );

		return [ css, warnings ];
	} finally {
		await browserInterface.cleanup();
	}
}

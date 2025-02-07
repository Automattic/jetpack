import { BrowserInterfacePlaywright } from './browser-interface-playwright.js';
import { BrowserInterface } from './browser-interface.js';
import { CSSFileSet } from './css-file-set.js';
import { SuccessTargetError, EmptyCSSError, UrlError } from './errors.js';
import { removeIgnoredPseudoElements } from './ignored-pseudo-elements.js';
import { minifyCss } from './minify-css.js';
import { FilterSpec, Viewport } from './types.js';

const noop = () => {
	// No op.
};

// Add this near the top with other constants
const DEFAULT_BATCH_SIZE = 5;

/**
 * Process a batch of URLs and update the CSS files set
 * @param {BrowserInterface} browserInterface - interface to access pages
 * @param {string[]}         urls             - list of URLs to scan for CSS files
 * @param {CSSFileSet}       cssFiles         - CSSFileSet object to update
 * @param {object}           errors           - object to store errors
 * @return {Promise< number >} - number of successes
 */
async function processBatch(
	browserInterface: BrowserInterface,
	urls: string[],
	cssFiles: CSSFileSet,
	errors: { [ url: string ]: UrlError }
): Promise< number > {
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

			successes++;
		} catch ( err ) {
			errors[ url ] = err;
		}
	}

	return successes;
}

/**
 * Collate and return a CSSFileSet object describing all the CSS files used by
 * the set of URLs provided.
 *
 * Errors that occur during this process are collated, but not thrown yet.
 *
 * @param {BrowserInterface} browserInterface - interface to access pages
 * @param {string[]}         urls             - list of URLs to scan for CSS files
 * @param {number}           maxPages         - number of pages to process at most
 * @param {number}           batchSize        - number of pages to process in each batch
 * @return {Array} - Two member array; CSSFileSet, and an object containing errors that occurred at each URL.
 */
async function collateCssFiles(
	browserInterface: BrowserInterface,
	urls: string[],
	maxPages: number,
	batchSize: number
): Promise< [ CSSFileSet, { [ url: string ]: UrlError } ] > {
	const cssFiles = new CSSFileSet( browserInterface );
	const errors = {};
	let totalSuccesses = 0;
	const failedUrls = new Set< string >();

	// Process URLs in batches
	for ( let i = 0; i < urls.length && totalSuccesses < maxPages; i += batchSize ) {
		const batchUrls = urls.slice( i, i + batchSize ).filter( url => ! failedUrls.has( url ) );

		// If no valid URLs in this batch, continue to next batch
		if ( batchUrls.length === 0 ) {
			continue;
		}

		// For Playwright, load the batch of pages
		if ( browserInterface instanceof BrowserInterfacePlaywright ) {
			await browserInterface.loadBatch( batchUrls );
		}

		const batchSuccesses = await processBatch( browserInterface, batchUrls, cssFiles, errors );
		totalSuccesses += batchSuccesses;

		// Add failed URLs from this batch to failedUrls set
		batchUrls.forEach( url => {
			if ( errors[ url ] ) {
				failedUrls.add( url );
				// eslint-disable-next-line no-console
				console.log( `Failed URL: ${ url }`, errors[ url ] );
			}
		} );

		// If we've tried all URLs and still haven't hit maxPages, break to avoid infinite loop
		if ( failedUrls.size === urls.length ) {
			break;
		}

		if ( totalSuccesses >= maxPages ) {
			break;
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
 * @param {number}           param.batchSize        - Number of pages to process in each batch
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
	batchSize,
	updateProgress,
}: {
	browserInterface: BrowserInterface;
	selectorPages: { [ selector: string ]: Set< string > };
	validUrls: string[];
	viewports: Viewport[];
	maxPages: number;
	batchSize: number;
	updateProgress: () => void;
} ): Promise< Set< string > > {
	// For each selector string, create a "trimmed" version with the stuff JavaScript can't handle cut out.
	const trimmedSelectors = Object.keys( selectorPages ).reduce( ( set, selector ) => {
		set[ selector ] = removeIgnoredPseudoElements( selector );
		return set;
	}, {} );

	// Go through all the URLs looking for above-the-fold selectors, and selectors which may be "dangerous"
	const aboveFoldSelectors = new Set< string >();
	const dangerousSelectors = new Set< string >();

	// Process URLs in batches
	for ( let i = 0; i < validUrls.length && i < maxPages; i += batchSize ) {
		const batchUrls = validUrls.slice( i, i + batchSize );

		// For Playwright, load the batch of pages
		if ( browserInterface instanceof BrowserInterfacePlaywright ) {
			await browserInterface.loadBatch( batchUrls );
		}

		// Process each URL in the batch
		for ( const url of batchUrls ) {
			// Work out which CSS selectors match any element on this page
			const pageSelectors = await browserInterface.runInPage< string[] >(
				url,
				null,
				BrowserInterface.innerFindMatchingSelectors,
				trimmedSelectors
			);

			// Check for selectors which may match this page, but are not included in this page's CSS
			pageSelectors
				.filter( s => ! selectorPages[ s ].has( url ) )
				.forEach( s => dangerousSelectors.add( s ) );

			// Collate all above-fold selectors for all viewport sizes
			for ( const size of viewports ) {
				updateProgress();

				const pageAboveFold = await browserInterface.runInPage< string[] >(
					url,
					size,
					BrowserInterface.innerFindAboveFoldSelectors,
					trimmedSelectors,
					pageSelectors
				);

				pageAboveFold.forEach( s => aboveFoldSelectors.add( s ) );
			}
		}
	}

	// Remove dangerous selectors from above fold set
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
 * @param {number}           root0.batchSize        - Number of pages to process in each batch (default: 5)
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
	batchSize = DEFAULT_BATCH_SIZE,
}: {
	browserInterface: BrowserInterface;
	progressCallback?: ( step: number, total: number ) => void;
	urls: string[];
	viewports: Viewport[];
	filters?: FilterSpec;
	successRatio?: number;
	maxPages?: number;
	batchSize?: number;
} ): Promise< [ string, Error[] ] > {
	// Success threshold is calculated based on the success ratio of "the number of URLs provided", or "maxPages" whichever is lower.
	// See 268-gh-Automattic/boost-cloud
	const successUrlsThreshold = Math.ceil( Math.min( urls.length, maxPages ) * successRatio );

	try {
		progressCallback = progressCallback || noop;
		let progress = 0;
		const progressSteps = 1 + urls.length * viewports.length;
		const updateProgress = () => progressCallback( ++progress, progressSteps );

		// Collate all CSS Files used by all valid URLs
		const [ cssFiles, cssFileErrors ] = await collateCssFiles(
			browserInterface,
			urls,
			maxPages,
			batchSize
		);
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
			batchSize,
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
		browserInterface.cleanup();
	}
}

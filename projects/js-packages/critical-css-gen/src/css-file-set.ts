import { BrowserInterface } from './browser-interface.ts';
import { HttpError, UnknownError, UrlError } from './errors.ts';
import { StyleAST } from './style-ast.ts';
import { FilterSpec } from './types.ts';

// Maximum number of iterations when pruning unused variables.
const maxVarPruneIterations = 10;

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
export class CSSFileSet {
	private knownUrls: { [ url: string ]: CSSFile | Error };
	private cssFiles: CSSFile[];
	private errors: Error[];
	private internalStyles: { [ url: string ]: StyleAST } = {};

	constructor( private browserInterface: BrowserInterface ) {
		this.knownUrls = {};
		this.cssFiles = [];
		this.errors = [];
	}

	/**
	 * Add a set of CSS URLs from an HTML page to this set.
	 *
	 * @param {string} page        - URL of the page the CSS URLs were found on.
	 * @param {object} cssIncludes - Included CSS Files. Keyed by URL.
	 */
	async addMultiple( page: string, cssIncludes: { [ url: string ]: { media: string } } ) {
		await Promise.all(
			Object.keys( cssIncludes ).map( url => this.add( page, url, cssIncludes[ url ] ) )
		);
	}

	async addInternalStyles( page: string, internalStyles: string ) {
		this.internalStyles[ page ] = StyleAST.parse( internalStyles );
	}

	/**
	 * Add a CSS URL from an HTML page to this set.
	 *
	 * @param {string} page     - URL of the page the CSS URL was found on.
	 * @param {string} cssUrl   - The CSS file URL.
	 * @param {object} settings - Additional settings for the CSS file.
	 */
	async add(
		page: string,
		cssUrl: string,
		settings: { [ url: string ]: string } = {}
	): Promise< void > {
		// Add by reference if we already know this file.
		if ( Object.prototype.hasOwnProperty.call( this.knownUrls, cssUrl ) ) {
			if ( this.knownUrls[ cssUrl ] instanceof Error ) {
				// We already know this URL failed. Bail early.
				return;
			}

			this.addExtraReference( page, cssUrl, this.knownUrls[ cssUrl ] as CSSFile );
			return;
		}

		// Try to load this URL.
		try {
			const response = await this.browserInterface.fetch( cssUrl, {}, 'css' );
			if ( ! response.ok ) {
				throw new HttpError( { code: response.status, url: cssUrl } );
			}

			let css = await response.text();

			// If there is an implied media query from the css's <link> tag, wrap the CSS in it.
			if ( settings.media ) {
				css = '@media ' + settings.media + ' {\n' + css + '\n}';
			}

			this.storeCss( page, cssUrl, css );
		} catch ( err ) {
			let wrappedError = err;

			// Wrap any unfamiliar fetch errors in an unknown error.
			if ( ! ( err instanceof UrlError ) ) {
				wrappedError = new UnknownError( {
					url: cssUrl,
					message: err.message,
				} );
			}

			this.storeError( cssUrl, wrappedError );
		}
	}

	/**
	 * Collates an object describing the selectors found in the CSS files in this set, and which
	 * HTML page URLs include them (via CSS files)
	 *
	 * @return {object} - An object with selector text keys, each containing a Set of page URLs (strings)
	 */
	collateSelectorPages(): { [ selector: string ]: Set< string > } {
		const selectors = {};

		for ( const file of this.cssFiles ) {
			file.ast.forEachSelector( selector => {
				if ( ! selectors[ selector ] ) {
					selectors[ selector ] = new Set();
				}

				file.pages.forEach( pageUrl => selectors[ selector ].add( pageUrl ) );
			} );
		}

		return selectors;
	}

	/**
	 * Applies filters to the properties or atRules in each AST in this set of CSS files.
	 * Mutates each AST in-place.
	 *
	 * @param {FilterSpec} filters - Object containing property and atRule filter functions.
	 */
	applyFilters( filters: FilterSpec ): void {
		for ( const file of this.cssFiles ) {
			file.ast.applyFilters( filters );
		}
	}

	/**
	 * Returns a new AST which is pruned appropriately for the specified contentWindow, and the
	 * set of selectors that are worth keeping. (i.e.: appear above the fold).
	 *
	 * @param {Set<string>} usefulSelectors - Set of selectors to keep.
	 * @return {StyleAST[]} Array of pruned StyleAST objects.
	 */
	prunedAsts( usefulSelectors: Set< string > ): StyleAST[] {
		// Perform basic pruning.
		let asts = this.cssFiles.map( file => {
			return file.ast.pruned( usefulSelectors );
		} );

		const internallyUsedVariables = new Set< string >();
		Object.values( this.internalStyles ).reduce( ( set, ast ) => {
			ast.getUsedVariables().forEach( v => set.add( v ) );
			return set;
		}, internallyUsedVariables );

		// Repeatedly prune unused variables (up to maxVarPruneIterations), to catch vars which are
		// only used to define other vars which aren't used.
		let prevUsedVariables;
		for ( let i = 0; i < maxVarPruneIterations; i++ ) {
			// Gather the set of used variables.
			const usedVariables = asts.reduce( ( set, ast ) => {
				ast.getUsedVariables().forEach( v => set.add( v ) );
				return set;
			}, new Set< string >() );

			// If the number of used vars hasn't changed since last iteration, stop early.
			if ( prevUsedVariables && prevUsedVariables.size === usedVariables.size ) {
				break;
			}

			// Prune unused variables, keep a sum of pruned variables.
			const prunedCount = asts.reduce( ( sum, ast ) => {
				sum += ast.pruneUnusedVariables(
					new Set( [ ...usedVariables, ...internallyUsedVariables ] )
				);
				return sum;
			}, 0 );

			// If no variables were pruned this iteration, stop early.
			if ( prunedCount === 0 ) {
				break;
			}

			prevUsedVariables = usedVariables;
		}

		// Find all fonts used across all ASTs, and prune all that are not referenced.
		const fontWhitelist = asts.reduce( ( set, ast ) => {
			ast.getUsedFontFamilies().forEach( font => set.add( font ) );
			return set;
		}, new Set< string >() );

		// Remove any fonts that aren't used above the fold.
		asts.forEach( ast => ast.pruneNonCriticalFonts( fontWhitelist ) );

		// Throw away any ASTs without rules.
		asts = asts.filter( ast => ast.ruleCount() > 0 );

		return asts;
	}

	/**
	 * Internal method: Store the specified css found at the cssUrl for an HTML page,
	 * de-duplicating CSS files by content along the way.
	 *
	 * @param {string} page   - URL of HTML page this CSS file was found on.
	 * @param {string} cssUrl - URL of the CSS file.
	 * @param {string} css    - Content of the CSS File.
	 */
	storeCss( page: string, cssUrl: string, css: string ): void {
		// De-duplicate css contents in case cache busters in URLs or WAFs, etc confound URL de-duplication.
		const matchingFile = this.cssFiles.find( file => file.css === css );
		if ( matchingFile ) {
			this.addExtraReference( page, cssUrl, matchingFile );
			return;
		}

		// Parse the CSS into an AST.
		const ast = StyleAST.parse( css );

		// Make sure relative URLs in the AST are absolute.
		ast.absolutifyUrls( cssUrl );

		const file = { css, ast, pages: [ page ], urls: [ cssUrl ] };
		this.knownUrls[ cssUrl ] = file;
		this.cssFiles.push( file );
	}

	/**
	 * Internal method: Add an extra reference to a previously known CSS file found either
	 * on a new HTML page, or at a new URL.
	 *
	 * @param {string} page         - URL of the page this CSS file was found on.
	 * @param {string} cssUrl       - URL of the CSS File.
	 * @param {object} matchingFile - Internal CSS File object.
	 */
	addExtraReference( page: string, cssUrl: string, matchingFile: CSSFile ): void {
		this.knownUrls[ cssUrl ] = matchingFile;
		matchingFile.pages.push( page );

		if ( ! matchingFile.urls.includes( cssUrl ) ) {
			matchingFile.urls.push( cssUrl );
		}
	}

	/**
	 * Stores an error that occurred while fetching or parsing CSS at the given URL.
	 *
	 * @param {string} url - CSS URL that failed to fetch or parse.
	 * @param {Error}  err - Error object describing the problem.
	 */
	storeError( url: string, err: Error ): void {
		this.knownUrls[ url ] = err;
		this.errors.push( err );
	}

	/**
	 * Returns a list of errors that occurred while fetching or parsing these CSS files.
	 *
	 * @return {Error[]} - List of errors that occurred.
	 */
	getErrors() {
		return this.errors;
	}
}

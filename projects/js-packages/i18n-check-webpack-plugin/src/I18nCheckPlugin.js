const npath = require( 'path' );
const babel = require( '@babel/core' );
const webpack = require( 'webpack' );
const GettextEntries = require( './GettextEntries.js' );
const GettextEntry = require( './GettextEntry.js' );
const GettextExtractor = require( './GettextExtractor.js' );
const PLUGIN_NAME = require( './plugin-name.js' );
const debug = require( 'debug' )( PLUGIN_NAME + ':plugin' ); // eslint-disable-line import/order
const debugtiming = require( 'debug' )( PLUGIN_NAME + ':timing' ); // eslint-disable-line import/order

const schema = {
	title: `${ PLUGIN_NAME } plugin options`,
	type: 'object',
	additionalProperties: false,
	definitions: {
		Filter: {
			description: 'Filter for modules to process.',
			anyOf: [
				{
					instanceof: 'RegExp',
					tsType: 'RegExp',
				},
				{
					type: 'string',
					absolutePath: false,
				},
				{
					instanceof: 'Function',
					tsType: '((path: string) => boolean)',
				},
			],
		},
	},
	properties: {
		// General options.
		filter: {
			description: 'Filter which source modules to check for i18n strings.',
			anyOf: [
				{
					$ref: '#/definitions/Filter',
				},
				{
					type: 'array',
					items: {
						$ref: '#/definitions/Filter',
					},
				},
			],
		},
		warnOnly: {
			description: 'Set true to produce warnings rather than errors.',
			type: 'boolean',
		},
		expectDomain: {
			description: 'Set the expected text domain.',
			type: 'string',
		},
		extractorOptions: {
			description: 'Options for the extractor. Ignored if `extractor` was specified.',
			type: 'object',
			additionalProperties: false,
			properties: {
				babelOptions: {
					description: 'Options for Babel',
					type: 'object',
					additionalProperties: true,
				},
				functions: {
					description:
						'Gettext functions to match. Key is the function name. Value is an array defining the arguments.',
					type: 'object',
					additionalProperties: {
						description: 'Function with arguments.',
						type: 'array',
						items: {
							description: 'Type of the argument.',
							enum: [ 'msgid', 'plural', 'context', 'domain', null ],
						},
					},
				},
			},
		},
	},
};

/**
 * Webpack plugin for the i18n check.
 *
 * The plugin hooks into Webpack to check that WordPress i18n wasn't
 * mangled by optimizations.
 */
class I18nCheckPlugin {
	#extractor;
	#filter;
	#reportkey;
	#expectDomain;

	constructor( options = {} ) {
		webpack.validateSchema( schema, options, {
			name: PLUGIN_NAME,
			baseDataPath: 'options',
		} );

		this.#extractor = new GettextExtractor( options.extractorOptions );
		this.#reportkey = options.warnOnly ? 'warnings' : 'errors';
		this.#expectDomain = options.expectDomain;

		if ( options.filter ) {
			const filters = ( Array.isArray( options.filter ) ? options.filter : [ options.filter ] ).map(
				filter => {
					if ( typeof filter === 'string' ) {
						return file => file === filter;
					}
					if ( filter instanceof RegExp ) {
						return file => filter.test( file );
					}
					return filter;
				}
			);
			this.#filter = file => filters.some( filter => filter( file ) );
		} else {
			this.#filter = file => /\.(?:jsx?|tsx?|cjs|mjs)$/.test( file );
		}
	}

	/**
	 * Record the resources for an asset.
	 *
	 * @param {webpack.Compilation} compilation - Compilation.
	 * @param {string} filename - Asset filename.
	 * @param {webpack.Module[]} modules - Modules in the asset.
	 */
	#recordResourcesForAsset( compilation, filename, modules ) {
		const resources = new Set();

		// Use a set to avoid processing the same module multiple times.
		const modulesSet = new Set( modules );
		for ( const module of modulesSet ) {
			if (
				module.resource &&
				this.#filter( npath.relative( compilation.compiler.context, module.resource ) )
			) {
				resources.add( module.resource );
			}

			// Modules (e.g. ConcatenatedModules) might have sub-modules. Process them too.
			if ( module.modules ) {
				for ( const m of module.modules ) {
					modulesSet.add( m );
				}
			}
		}

		// Update the asset.
		compilation.updateAsset( filename, v => v, { resources: [ ...resources ] } );
	}

	/**
	 * Stringify an entry to msgid + context.
	 *
	 * @param {GettextEntry} entry - Entry.
	 * @returns {string} String.
	 */
	#strentry( entry ) {
		let ret = '"' + entry.msgid.replace( /[\\"]/g, '\\$&' ).replaceAll( '\n', '\\n' ) + '"';
		if ( entry.context !== '' ) {
			ret +=
				' (context "' + entry.context.replace( /[\\"]/g, '\\$&' ).replaceAll( '\n', '\\n' ) + '")';
		}
		return ret;
	}

	apply( compiler ) {
		compiler.hooks.thisCompilation.tap( PLUGIN_NAME, compilation => {
			// Record the resources going into an asset when the asset is created.
			compilation.hooks.moduleAsset.tap( PLUGIN_NAME, ( module, filename ) => {
				this.#recordResourcesForAsset( compilation, filename, [ module ] );
			} );
			compilation.hooks.chunkAsset.tap( PLUGIN_NAME, ( chunk, filename ) => {
				this.#recordResourcesForAsset(
					compilation,
					filename,
					compilation.chunkGraph.getChunkModules( chunk )
				);
			} );

			// During the "analyze assets" step, check the assets.
			const moduleCache = new Map();
			compilation.hooks.processAssets.tapPromise(
				{
					name: PLUGIN_NAME,
					stage: webpack.Compilation.PROCESS_ASSETS_STAGE_ANALYSE,
					additionalAssets: true,
				},
				assets => {
					const t0 = Date.now();
					const promises = [];
					for ( const filename of Object.keys( assets ) ) {
						promises.push( this.#processAsset( compilation, filename, moduleCache ) );
					}
					return Promise.all( promises ).finally( () => {
						debugtiming( `Processed all assets in ${ Date.now() - t0 }ms` );
					} );
				}
			);
		} );
	}

	/**
	 * Process an asset.
	 *
	 * @param {webpack.Compilation} compilation - Compilation.
	 * @param {string} filename - Asset filename.
	 * @param {Map} moduleCache - Cache for processed modules.
	 */
	async #processAsset( compilation, filename, moduleCache ) {
		const t0 = Date.now();
		const asset = compilation.getAsset( filename );

		// Detemine if we even need to process this asset. JavaScript assets seem to always
		// have "javascriptModule" in their info, so look for that.
		if ( typeof asset.info.javascriptModule === 'undefined' ) {
			debug( `Asset ${ filename } does not seem to be JavaScript, skipping.` );
			return;
		}
		if ( ! asset.info.resources || asset.info.resources.length <= 0 ) {
			debug( `No resources associated with ${ filename }, skipping.` );
			return;
		}

		// Extract strings from the source resources.
		const sourceEntries = new Set();
		const promises = [];
		for ( const resource of asset.info.resources ) {
			if ( ! moduleCache.has( resource ) ) {
				const promise = this.#extractor.extractFromFile( resource, {
					filename: npath.relative( compilation.compiler.context, resource ),
				} );
				moduleCache.set( resource, promise );
			}
			promises.push(
				moduleCache.get( resource ).then( resourceEntries => {
					resourceEntries.forEach( e => sourceEntries.add( e ) );
				} )
			);
		}

		// Extract strings from the asset.
		const lintLogger = s => {
			compilation[ this.#reportkey ].push( new Error( s ) );
		};
		let babelFile, assetEntries;
		promises.push(
			( async () => {
				const source = asset.source.source();
				babelFile = await this.#extractor.parse( source, { filename, lintLogger } );
				assetEntries = this.#extractor.extractFromAst( babelFile, { filename, lintLogger } );
			} )()
		);

		// Wait for all the extractions to complete.
		await Promise.all( promises );

		// Analyze. First, collect the missing entries and report any entries with lost translator comments.
		const missingEntries = new GettextEntries();
		const didMissingCommentEntries = new Set();
		for ( const entry of sourceEntries ) {
			if ( ! assetEntries.has( entry ) ) {
				missingEntries.add( entry );
				continue;
			}

			const assetComments = assetEntries.get( entry ).comments;
			const missingComments = [ ...entry.comments ].filter( c => ! assetComments.has( c ) );
			if ( missingComments.length ) {
				const str = this.#strentry( entry );
				if ( ! didMissingCommentEntries.has( str ) ) {
					didMissingCommentEntries.add( str );
					compilation[ this.#reportkey ].push(
						new Error(
							// prettier-ignore
							`${ filename }: Translator comments have gone missing for ${ str }\n - ` + missingComments.join( '\n - ' )
						)
					);
				}
			}
		}

		// For missing entries, ignore them if the msgid or context doesn't appear in the asset at all.
		// In that case we assume they were removed by tree shaking rather than an optimization problem.
		// Report any where the strings do still exist in the asset source.
		if ( missingEntries.size > 0 ) {
			const neededStrings = new Set();
			missingEntries.forEach( entry => {
				neededStrings.add( entry.msgid );
				neededStrings.add( entry.context );
			} );

			const foundStrings = new Set( [ '' ] ); // Empty string is always "found", as that's the context for `__()` and `_n()`.
			babel.traverse(
				babelFile.ast,
				{
					'StringLiteral|TemplateLiteral': path => {
						let s;
						if ( babel.types.isStringLiteral( path.node ) ) {
							s = path.node.value;
						} else if ( path.node.expressions.length === 0 ) {
							s = path.node.quasis[ 0 ].value.cookied;
						} else {
							return;
						}
						if ( neededStrings.has( s ) ) {
							foundStrings.add( s );
						}
					},
				},
				babelFile.source
			);
			const foundEntries = new GettextEntries();
			missingEntries.forEach( entry => {
				if ( foundStrings.has( entry.msgid ) && foundStrings.has( entry.context ) ) {
					missingEntries.delete( entry );
					foundEntries.add( entry );
				}
			} );

			if ( foundEntries.size > 0 ) {
				compilation[ this.#reportkey ].push(
					new Error(
						`${ filename }: Optimization seems to have broken the following translation strings:\n - ` +
							Array.from( foundEntries.values(), this.#strentry ).sort().join( '\n - ' )
					)
				);
			}
			if ( missingEntries.size > 0 ) {
				debug(
					`${ filename }: The following translation strings seem to have been removed entirely, or at least got mangled beyond recognition:\n` +
						' - ' +
						Array.from( missingEntries.values(), this.#strentry ).sort().join( '\n - ' )
				);
			}
		}

		// Check the number of domains used.
		const domains = new Set();
		assetEntries.forEach( e => domains.add( e.domain ) );
		domains.delete( '' );
		if ( domains.size > 1 ) {
			compilation[ this.#reportkey ].push(
				new Error(
					// prettier-ignore
					`${ filename }: Multiple textdomains are used: ${ Array.from( domains, JSON.stringify ).sort().join( ', ' ) }\nYou may want to use @automattic/babel-plugin-replace-textdomain to fix that.`
				)
			);
		} else if ( this.#expectDomain && domains.size > 0 && ! domains.has( this.#expectDomain ) ) {
			compilation[ this.#reportkey ].push(
				new Error(
					// prettier-ignore
					`${ filename }: Expected textdomain ${ JSON.stringify( this.#expectDomain ) }, but the asset uses ${ Array.from( domains, JSON.stringify )[ 0 ] } instead.\nYou may want to use @automattic/babel-plugin-replace-textdomain to fix that.`
				)
			);
		}
		debugtiming( `Processed asset ${ filename } in ${ Date.now() - t0 }ms` );
	}
}

module.exports = I18nCheckPlugin;

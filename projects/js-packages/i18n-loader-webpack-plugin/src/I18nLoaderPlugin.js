const path = require( 'path' );
const webpack = require( 'webpack' );
const I18nLoaderModuleDependency = require( './I18nLoaderModuleDependency' );
const I18nLoaderRuntimeModule = require( './I18nLoaderRuntimeModule' );
const PLUGIN_NAME = require( './plugin-name' );
const debug = require( 'debug' )( PLUGIN_NAME ); // eslint-disable-line import/order

const { RuntimeGlobals } = webpack;

const schema = {
	title: `${ PLUGIN_NAME } plugin options`,
	type: 'object',
	additionalProperties: false,
	definitions: {
		ModuleFilter: {
			description: 'Filter for modules to ignore.',
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
					tsType: '((path: string, module: object) => boolean)',
				},
			],
		},
	},
	properties: {
		loaderModule: {
			description: 'Externalized module supplying the i18n loader.',
			type: 'string',
		},
		loaderMethod: {
			description: 'Method on the loader module to call to load the i18n.',
			type: 'string',
		},
		textdomain: {
			description: 'I18n textdomain to load.',
			type: 'string',
		},
		target: {
			description: 'Building for use in a plugin (default), a theme, or WordPress core.',
			enum: [ 'plugin', 'theme', 'core' ],
		},
		path: {
			description: 'Path (relative to the package or plugin) to locate the output assets.',
			type: 'string',
		},
		ignoreModules: {
			description: 'Modules to ignore when looking for uses of @wordpress/i18n.',
			anyOf: [
				{
					$ref: '#/definitions/ModuleFilter',
				},
				{
					type: 'array',
					items: {
						$ref: '#/definitions/ModuleFilter',
					},
				},
			],
		},
	},
};

/**
 * Webpack plugin for the i18n loader.
 *
 * The plugin hooks into Webpack to manipulate modules and add the
 * I18nLoaderRuntimeModule as appropriate.
 */
class I18nLoaderPlugin {
	constructor( options = {} ) {
		webpack.validateSchema( schema, options, {
			name: PLUGIN_NAME,
			baseDataPath: 'options',
		} );

		this.options = {
			target: 'plugin',
			loaderModule: '@wordpress/jp-i18n-loader',
			loaderMethod: 'downloadI18n',
			...options,
		};

		if ( options.ignoreModules ) {
			const filters = ( Array.isArray( options.ignoreModules )
				? options.ignoreModules
				: [ options.ignoreModules ]
			).map( filter => {
				if ( typeof filter === 'string' ) {
					return request => request === filter;
				}
				if ( filter instanceof RegExp ) {
					return request => filter.test( request );
				}
				return filter;
			} );
			this.options.ignoreModules = ( module, context ) =>
				filters.some( f => f( path.relative( context, module.request || '' ), module ) );
		} else {
			this.options.ignoreModules = () => false;
		}
	}

	apply( compiler ) {
		// Register the dependency class.
		compiler.hooks.compilation.tap( PLUGIN_NAME, ( compilation, { normalModuleFactory } ) => {
			compilation.dependencyFactories.set( I18nLoaderModuleDependency, normalModuleFactory );
			compilation.dependencyTemplates.set(
				I18nLoaderModuleDependency,
				new I18nLoaderModuleDependency.Template()
			);
		} );

		// At the "make" hook, inject Dependency objects into the build so we can get the modules we need.
		const loaderModuleDep = new I18nLoaderModuleDependency( this.options.loaderModule );
		loaderModuleDep.optional = true;
		compiler.hooks.make.tapPromise( PLUGIN_NAME, compilation => {
			return new Promise( ( resolve, reject ) => {
				compilation.addModuleChain( compiler.context, loaderModuleDep, ( err, module ) => {
					if ( err ) {
						return reject( err );
					}
					// Webpack bug; Until 5.51.0 it didn't pass the module to the callback.
					if ( ! module && ! compilation.moduleGraph.getModule( loaderModuleDep ) ) {
						// prettier-ignore
						let msg = `${ PLUGIN_NAME }:\nFailed to add loader module ${ this.options.loaderModule } to the build.\n`;
						if ( this.options.loaderModule.startsWith( '@wordpress/' ) ) {
							msg +=
								"You'll need to add @wordpress/dependency-extraction-webpack-plugin or an appropriate externals directive to your Webpack config.";
						} else {
							msg +=
								"You'll need to add the appropriate externals directive to your Webpack config.";
						}
						compilation.errors.push( new webpack.WebpackError( msg ) );
					}
					resolve();
				} );
			} );
		} );

		compiler.hooks.thisCompilation.tap( PLUGIN_NAME, compilation => {
			/**
			 * Fetch stuff we need for the various callbacks.
			 *
			 * @returns {object} Stuff.
			 */
			function getStuff() {
				const loaderModule = compilation.moduleGraph.getModule( loaderModuleDep );

				const i18nModules = new Set();
				for ( const module of compilation.modules ) {
					// rawRequest is for a NormalModule. userRequest is for an ExternalModule. Other types we don't really care about.
					if (
						module.rawRequest === '@wordpress/i18n' ||
						module.userRequest === '@wordpress/i18n'
					) {
						i18nModules.add( module );
					}
				}
				const i18nModulesArr = [ ...i18nModules ];

				return { loaderModule, i18nModulesArr, chunkGraph: compilation.chunkGraph };
			}

			// After chunks have been optimized (e.g. chunk splitting happened), determine which chunks need
			// our deps and inject them.
			compilation.hooks.afterOptimizeChunks.tap( PLUGIN_NAME, chunks => {
				const { loaderModule, i18nModulesArr, chunkGraph } = getStuff();
				if ( ! loaderModule ) {
					debug( "Loader module is missing, can't run." );
					return;
				}
				if ( i18nModulesArr.length <= 0 ) {
					debug( "I18n module is missing, can't run." );
					return;
				}

				debug( 'Checking for async chunks with i18n:' );
				for ( const chunk of chunks ) {
					if ( ! chunk.hasRuntime() ) {
						debug(
							// prettier-ignore
							` -- Chunk ${ chunk.name || chunk.id || chunk.debugId } has no runtime, skipping.`
						);
						continue;
					}

					// Determine if we need to inject into this chunk.
					let any = false;
					loop: for ( const subchunk of chunk.getAllAsyncChunks() ) {
						for ( const module of chunkGraph.getChunkModules( subchunk ) ) {
							// rawRequest is for a NormalModule. userRequest is for an ExternalModule. Other types we don't really care about.
							if ( this.options.ignoreModules( module, compiler.context ) ) {
								// Ignore.
							} else if (
								module.rawRequest === '@wordpress/i18n' ||
								module.userRequest === '@wordpress/i18n' ||
								module.dependencies.some( d => d.request === '@wordpress/i18n' )
							) {
								debug(
									// prettier-ignore
									` ✅ Chunk ${ chunk.name || chunk.id || chunk.debugId } has an async chunk ${ subchunk.name || subchunk.id || subchunk.debugId } using @wordpress/i18n!`
								);
								any = true;
								break loop;
							}
						}
					}
					if ( ! any ) {
						debug(
							// prettier-ignore
							` ❌ Chunk ${ chunk.name || chunk.id || chunk.debugId } has no async chunks using @wordpress/i18n!`
						);
						continue;
					}

					// Inject into the chunk!
					if ( chunkGraph.isModuleInChunk( loaderModule, chunk ) ) {
						debug( `    Already had ${ this.options.loaderModule }` );
					} else {
						chunkGraph.connectChunkAndModule( chunk, loaderModule );
						chunkGraph.addModuleRuntimeRequirements(
							loaderModule,
							chunk.runtime,
							new Set( [ RuntimeGlobals.module ] )
						);
					}

					// Any chunk using this as a runtime doesn't itself need the injected modules.
					for ( const c of chunk.getAllReferencedChunks() ) {
						if ( c === chunk ) {
							continue;
						}
						if ( chunkGraph.isModuleInChunk( loaderModule, c ) ) {
							debug(
								// prettier-ignore
								`    Removing redundant ${ this.options.loaderModule } from chunk ${ c.name || c.id || c.debugId }`
							);
							chunkGraph.disconnectChunkAndModule( c, loaderModule );
						}
					}
				}
			} );

			// This is just for debugging, to see if later optimizations removed our modules.
			compilation.hooks.afterOptimizeChunkModules.tap( PLUGIN_NAME, chunks => {
				const { loaderModule, i18nModulesArr, chunkGraph } = getStuff();
				if ( ! loaderModule || i18nModulesArr.length <= 0 ) {
					return;
				}

				debug( 'After optimizations,' );
				for ( const chunk of chunks ) {
					if ( chunkGraph.isModuleInChunk( loaderModule, chunk ) ) {
						debug(
							// prettier-ignore
							` ✅ Chunk ${ chunk.name || chunk.id || chunk.debugId } contains ${ this.options.loaderModule }`
						);
					} else {
						debug(
							// prettier-ignore
							` ❌ Chunk ${ chunk.name || chunk.id || chunk.debugId } does not contain ${ this.options.loaderModule }`
						);
					}
					if ( i18nModulesArr.some( m => chunkGraph.isModuleInChunk( m, chunk ) ) ) {
						debug(
							// prettier-ignore
							` ✅ Chunk ${ chunk.name || chunk.id || chunk.debugId } contains @wordpress/i18n`
						);
					} else {
						debug(
							// prettier-ignore
							` ❌ Chunk ${ chunk.name || chunk.id || chunk.debugId } does not contain @wordpress/i18n`
						);
					}
				}
			} );

			// And add our runtime module to the chunks that may need it.
			compilation.hooks.runtimeRequirementInTree
				.for( webpack.RuntimeGlobals.ensureChunkHandlers )
				.tap( PLUGIN_NAME, ( chunk, set ) => {
					const { loaderModule, i18nModulesArr } = getStuff();
					if ( ! loaderModule || i18nModulesArr.length <= 0 ) {
						return;
					}

					debug( `Queuing runtime module for ${ chunk.name || chunk.id || chunk.debugId }.` );
					set.add( webpack.RuntimeGlobals.getChunkScriptFilename );
					compilation.addRuntimeModule(
						chunk,
						new I18nLoaderRuntimeModule( set, {
							...this.options,
							loaderModuleName: this.options.loaderModule,
							loaderModule,
							i18nModulesArr,
						} )
					);
				} );
		} );
	}
}

module.exports = I18nLoaderPlugin;

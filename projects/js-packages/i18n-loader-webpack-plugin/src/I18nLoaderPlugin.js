const path = require( 'path' );
const webpack = require( 'webpack' );
const { RuntimeGlobals } = webpack;

const PLUGIN_NAME = require( './plugin-name' );
const debug = require( 'debug' )( PLUGIN_NAME );
const I18nLoaderModuleDependency = require( './I18nLoaderModuleDependency' );
const I18nLoaderRuntimeModule = require( './I18nLoaderRuntimeModule' );

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
		stateModule: {
			description: 'Externalized module supplying the i18n state.',
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
			description: 'Path (relative to the plugin) to locate the output assets.',
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
			stateModule: '@wordpress/jp-i18n-state',
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
		const stateModuleDep = new I18nLoaderModuleDependency( this.options.stateModule );
		stateModuleDep.optional = true;
		const i18nModuleDep = new I18nLoaderModuleDependency( '@wordpress/i18n' );
		i18nModuleDep.optional = true;
		compiler.hooks.make.tapPromise( PLUGIN_NAME, compilation => {
			return Promise.all( [
				new Promise( ( resolve, reject ) => {
					compilation.addModuleChain( compiler.context, stateModuleDep, ( err, module ) => {
						if ( err ) {
							return reject( err );
						}
						// Webpack bug; Until 5.51.0 it didn't pass the module to the callback.
						if ( ! module && ! compilation.moduleGraph.getModule( stateModuleDep ) ) {
							// prettier-ignore
							let msg = `${ PLUGIN_NAME }:\nFailed to add state module ${ this.options.stateModule } to the build.\n`;
							if ( this.options.stateModule.startsWith( '@wordpress/' ) ) {
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
				} ),
				new Promise( ( resolve, reject ) => {
					compilation.addModuleChain( compiler.context, i18nModuleDep, ( err, module ) => {
						if ( err ) {
							return reject( err );
						}
						// Webpack bug; Until 5.51.0 it didn't pass the module to the callback.
						if ( ! module && ! compilation.moduleGraph.getModule( i18nModuleDep ) ) {
							compilation.errors.push(
								new webpack.WebpackError(
									`${ PLUGIN_NAME }:\nFailed to add i18n module @wordpress/i18n to the build.\n` +
										"You'll need to add @wordpress/dependency-extraction-webpack-plugin or an appropriate externals directive to your Webpack config, or add @wordpress/i18n to your package.json."
								)
							);
						}
						resolve();
					} );
				} ),
			] );
		} );

		compiler.hooks.thisCompilation.tap( PLUGIN_NAME, compilation => {
			/**
			 * Fetch stuff we need for the various callbacks.
			 *
			 * @returns {object} Stuff.
			 */
			function getStuff() {
				const stateModule = compilation.moduleGraph.getModule( stateModuleDep );
				const i18nModule = compilation.moduleGraph.getModule( i18nModuleDep );

				const i18nModules = new Set( [ i18nModule ] );
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

				return { stateModule, i18nModule, i18nModulesArr, chunkGraph: compilation.chunkGraph };
			}

			// After chunks have been optimized (e.g. chunk splitting happened), determine which chunks need
			// our deps and inject them.
			compilation.hooks.afterOptimizeChunks.tap( PLUGIN_NAME, chunks => {
				const { stateModule, i18nModule, i18nModulesArr, chunkGraph } = getStuff();
				if ( ! stateModule ) {
					debug( "State module is missing, can't run." );
					return;
				}
				if ( ! i18nModule || i18nModulesArr.length <= 0 ) {
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
					if ( chunkGraph.isModuleInChunk( stateModule, chunk ) ) {
						debug( `    Already had ${ this.options.stateModule }` );
					} else {
						chunkGraph.connectChunkAndModule( chunk, stateModule );
						chunkGraph.addModuleRuntimeRequirements(
							stateModule,
							chunk.runtime,
							new Set( [ RuntimeGlobals.module ] )
						);
					}
					if ( ! i18nModulesArr.some( m => chunkGraph.isModuleInChunk( m, chunk ) ) ) {
						debug( "    Didn't itself use @wordpress/i18n" );
						chunkGraph.connectChunkAndModule( chunk, i18nModule );
					}

					// Any chunk using this as a runtime doesn't itself need the injected modules.
					for ( const c of chunk.getAllReferencedChunks() ) {
						if ( c === chunk ) {
							continue;
						}
						if ( chunkGraph.isModuleInChunk( stateModule, c ) ) {
							debug(
								// prettier-ignore
								`    Removing redundant ${ this.options.stateModule } from chunk ${ c.name || c.id || c.debugId }`
							);
							chunkGraph.disconnectChunkAndModule( c, stateModule );
						}
						for ( const m of i18nModulesArr ) {
							if ( chunkGraph.isModuleInChunk( m, c ) ) {
								debug(
									// prettier-ignore
									`    Removing redundant @wordpress/i18n from chunk ${ c.name || c.id || c.debugId }`
								);
								chunkGraph.disconnectChunkAndModule( c, m );
							}
						}
					}
				}
			} );

			// This is just for debugging, to see if later optimizations removed our modules.
			compilation.hooks.afterOptimizeChunkModules.tap( PLUGIN_NAME, chunks => {
				const { stateModule, i18nModulesArr, chunkGraph } = getStuff();
				if ( ! stateModule || i18nModulesArr.length <= 0 ) {
					return;
				}

				debug( 'After optimizations,' );
				for ( const chunk of chunks ) {
					if ( chunkGraph.isModuleInChunk( stateModule, chunk ) ) {
						debug(
							// prettier-ignore
							` ✅ Chunk ${ chunk.name || chunk.id || chunk.debugId } contains ${ this.options.stateModule }`
						);
					} else {
						debug(
							// prettier-ignore
							` ❌ Chunk ${ chunk.name || chunk.id || chunk.debugId } does not contain ${ this.options.stateModule }`
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
					const { stateModule, i18nModulesArr } = getStuff();
					if ( ! stateModule || i18nModulesArr.length <= 0 ) {
						return;
					}

					debug( `Queuing runtime module for ${ chunk.name || chunk.id || chunk.debugId }.` );
					compilation.addRuntimeModule(
						chunk,
						new I18nLoaderRuntimeModule( set, {
							...this.options,
							stateModuleName: this.options.stateModule,
							stateModule,
							i18nModulesArr,
						} )
					);
				} );
		} );
	}
}

module.exports = I18nLoaderPlugin;

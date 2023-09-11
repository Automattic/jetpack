const path = require( 'path' );
const webpack = require( 'webpack' );
const { Template, RuntimeGlobals } = webpack;
const PLUGIN_NAME = require( './plugin-name' );
const debug = require( 'debug' )( PLUGIN_NAME ); // eslint-disable-line import/order

/**
 * Webpack RuntimeModule for the i18n loader.
 *
 * The runtime module supplies the code that winds up in the Webpack runtime
 * chunk. It gets added to chunks as appropriate by the plugin.
 */
class I18nLoaderRuntimeModule extends webpack.RuntimeModule {
	constructor( set, options ) {
		super( `loading ${ PLUGIN_NAME }` );
		this.runtimeRequirements = set;
		this.runtimeOptions = options;
	}

	/**
	 * Get the path for a chunk.
	 *
	 * @param {webpack.Chunk} chunk - Chunk.
	 * @returns {string} Chunk path
	 */
	getChunkPath( chunk ) {
		const compilation = this.compilation;
		return path.join(
			this.runtimeOptions.path ||
				path.relative( compilation.compiler.context, compilation.outputOptions.path ),
			compilation.getPath(
				chunk.filenameTemplate ||
					( chunk.canBeInitial()
						? compilation.outputOptions.filename
						: compilation.outputOptions.chunkFilename ),
				{
					chunk,
					contentHashType: 'javascript',
				}
			)
		);
	}

	/**
	 * Get set of chunks we need to care about.
	 *
	 * @returns {Set} Chunk IDs.
	 */
	getChunks() {
		const ret = new Set();
		const { chunkGraph } = this.compilation;

		for ( const chunk of this.chunk.getAllAsyncChunks() ) {
			for ( const module of chunkGraph.getChunkModules( chunk ) ) {
				if ( this.runtimeOptions.ignoreModules( module, this.compilation.compiler.context ) ) {
					// Ignore
				} else if (
					module.rawRequest === '@wordpress/i18n' ||
					module.userRequest === '@wordpress/i18n' ||
					module.dependencies.some( d => d.request === '@wordpress/i18n' )
				) {
					ret.add( chunk.id );
					continue;
				}
			}
		}
		return ret;
	}

	generate() {
		const { chunk, compilation, runtimeOptions, runtimeRequirements } = this;
		const { loaderModule, loaderMethod, loaderModuleName, textdomain, target } = runtimeOptions;
		const { chunkGraph, runtimeTemplate } = compilation;
		const basepath =
			this.runtimeOptions.path ||
			path.relative( compilation.compiler.context, compilation.outputOptions.path );
		const chunks = this.getChunks();

		if ( ! chunks.size ) {
			debug( `No async submodules using @wordpress/i18n in ${ this.getChunkPath( chunk ) }.` );
			return null;
		}
		debug( `Adding i18n-loading runtime for ${ this.getChunkPath( chunk ) }.` );

		// The hooks should have injected the loader module. Check to make sure it's still there.
		if ( ! chunkGraph.isModuleInChunk( loaderModule, chunk ) ) {
			throw new webpack.WebpackError(
				// prettier-ignore
				`Chunk ${ chunk.name || chunk.id || chunk.debugId } (${ this.getChunkPath( chunk ) }) has submodules using @wordpress/i18n, but is missing the loader module ${ loaderModuleName }.`
			);
		}

		// Check that we have a textdomain.
		if ( ! textdomain ) {
			throw new webpack.WebpackError(
				// prettier-ignore
				`Chunk ${ this.getChunkPath( chunk ) } has submodules using @wordpress/i18n, but no textdomain was passed to ${ PLUGIN_NAME }. Please fix your Webpack configuration.`
			);
		}

		// Determine the WordPress module name that @wordpress/dependency-extraction-webpack-plugin will (by default) use.
		let depName = loaderModuleName;
		if ( depName.startsWith( '@wordpress/' ) ) {
			// prettier-ignore
			depName = 'wp.' + depName.substring( 11 ).replace( /-([a-z])/g, ( _, letter ) => letter.toUpperCase() );
		}

		// Build the runtime code.
		// prettier-ignore
		return Template.asString( [
			'var installedChunks = {',
			Template.indent( Array.from( chunks.values(), id => `${ JSON.stringify( id ) }: 0` ).join( ',\n' ) ),
			'};',
			'',
			'var loadI18n = ' +
				runtimeTemplate.basicFunction( 'chunkId', [
					'var loader = ' + runtimeTemplate.moduleExports( {
						module: loaderModule,
						chunkGraph,
						request: loaderModuleName,
						runtimeRequirements,
					} ) + ';',
					`if ( loader && loader.${ loaderMethod } )`,
					Template.indent(
						`return loader.${ loaderMethod }( ${ JSON.stringify( basepath + '/' ) } + ${ RuntimeGlobals.getChunkScriptFilename }( chunkId ), ${ JSON.stringify( textdomain ) }, ${ JSON.stringify( target ) } );`,
					),
					`return Promise.reject( new Error( ${ JSON.stringify( 'I18n loader is not available. Check that WordPress is exporting ' + depName + '.' ) } ) );`,
				] ) + ';',
			'',
			`${ RuntimeGlobals.ensureChunkHandlers }.wpI18n = ` + runtimeTemplate.basicFunction( 'chunkId, promises', [
				'if ( installedChunks[chunkId] ) {',
				Template.indent( 'promises.push( installedChunks[chunkId] );' ),
				'} else if ( installedChunks[chunkId] === 0 ) {',
				Template.indent( [
					'promises.push( installedChunks[chunkId] = loadI18n( chunkId ).then( ',
					Template.indent( [
						runtimeTemplate.basicFunction( '', [ 'installedChunks[chunkId] = false;' ] ) + ',',
						runtimeTemplate.basicFunction( 'e', [
							'installedChunks[chunkId] = 0;',
							"// Log only, we don't want i18n failure to break the entire page.",
							'console.error( "Failed to fetch i18n data: ", e );',
						] ),
					] ),
					') );',
				] ),
				'}',
			] ) + ';',
		] );
	}
}

module.exports = I18nLoaderRuntimeModule;

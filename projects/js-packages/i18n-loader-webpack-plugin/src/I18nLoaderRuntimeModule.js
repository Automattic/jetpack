const { default: md5 } = require( 'md5-es' );
const path = require( 'path' );
const webpack = require( 'webpack' );
const { Template, RuntimeGlobals } = webpack;

const PLUGIN_NAME = require( './plugin-name' );
const debug = require( 'debug' )( PLUGIN_NAME );

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
	 * Get info for chunks we need to care about.
	 *
	 * @returns {Map} Map of chunk ID to data.
	 */
	getChunkInfo() {
		const ret = new Map();
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
					const [ chunkPath, query ] = this.getChunkPath( chunk ).split( '?', 2 );
					ret.set( chunk.id, {
						chunkPath,
						query,
						hash: md5.hash( chunkPath ),
					} );
					continue;
				}
			}
		}
		return ret;
	}

	generate() {
		const { chunk, compilation, runtimeOptions, runtimeRequirements } = this;
		const { stateModule, stateModuleName, i18nModulesArr, textdomain } = runtimeOptions;
		const { chunkGraph, runtimeTemplate } = compilation;
		const chunkInfo = this.getChunkInfo();

		if ( ! chunkInfo.size ) {
			debug( `No async submodules using @wordpress/i18n in ${ this.getChunkPath( chunk ) }.` );
			return null;
		}
		debug( `Adding i18n-loading runtime for ${ this.getChunkPath( chunk ) }.` );

		// The hooks should have injected the state and i18n modules. Check to make sure they're still there.
		if ( ! chunkGraph.isModuleInChunk( stateModule, chunk ) ) {
			throw new webpack.WebpackError(
				// prettier-ignore
				`Chunk ${ chunk.name || chunk.id || chunk.debugId } (${ this.getChunkPath( chunk ) }) has submodules using @wordpress/i18n, but is missing the state module ${ stateModuleName }.`
			);
		}
		let i18nModule;
		for ( const m of i18nModulesArr ) {
			if ( chunkGraph.isModuleInChunk( m, chunk ) ) {
				i18nModule = m;
				break;
			}
		}
		if ( ! i18nModule ) {
			throw new webpack.WebpackError(
				// prettier-ignore
				`Chunk ${ chunk.name || chunk.id || chunk.debugId } (${ this.getChunkPath( chunk ) }) has submodules using @wordpress/i18n, but is itself missing @wordpress/i18n.`
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
		let depName = stateModuleName;
		if ( depName.startsWith( '@wordpress/' ) ) {
			// prettier-ignore
			depName = 'wp.' + depName.substring( 11 ).replace( /-([a-z])/g, ( _, letter ) => letter.toUpperCase() );
		}

		const targetcode = {
			plugin: '"plugins/" + ',
			theme: '"themes/" + ',
			core: '',
		}[ this.runtimeOptions.target ];
		const domaincode = `state.domainMap[textdomain] || ( ${ targetcode }textdomain )`;

		// Build the runtime code.
		// prettier-ignore
		return Template.asString( [
			`var textdomain = ${ JSON.stringify( textdomain ) };`,
			'var chunkInfo = {',
			Template.indent(
				Array.from( chunkInfo.entries(), ( [ k, v ] ) => {
					const items = [
						Template.toNormalComment( v.chunkPath ) + ' ' + JSON.stringify( v.hash ),
						v.query ? JSON.stringify( '?' + v.query ) : '""',
					];
					return `${ JSON.stringify( k ) }: [ ${ items.join( ', ' ) } ]`;
				} ).join( ',\n' )
			),
			'};',
			'',
			'var loadI18n = ' +
				runtimeTemplate.basicFunction( 'info', [
					'var i18n = ' + runtimeTemplate.moduleExports( {
						module: i18nModule,
						chunkGraph,
						request: '@wordpress/i18n',
						runtimeRequirements,
					} ) + ';',
					'var state = ' + runtimeTemplate.moduleExports( {
						module: stateModule,
						chunkGraph,
						request: stateModuleName,
						runtimeRequirements,
					} ) + ';',
					`if ( ! state ) return Promise.reject( new Error( ${ JSON.stringify( 'I18n state is not available. Check that WordPress is exporting ' + depName + '.' ) } ) );`,
					`if ( state.locale === "en_US" ) return Promise.resolve();`,
					'if ( typeof fetch === "undefined" ) return Promise.reject( new Error( "Fetch API is not available." ) );',
					'return fetch(',
					Template.indent( [
						runtimeTemplate.supportTemplateLiteral()
							? '`${ state.baseUrl }${ ' + domaincode + ' }-${ state.locale }-${ info[0] }.json${ info[1] }`'
							: 'state.baseUrl + ( ' + domaincode + ' ) + "-" + state.locale + "-" + info[0] + ".json" + info[1]',
					] ),
					').then( ' + runtimeTemplate.basicFunction( 'res', [
						'if ( ! res.ok ) throw new Error( "HTTP request failed: " + res.status + " " + res.statusText );',
						'return res.json();',
					] ) + ' ).then( ' + runtimeTemplate.basicFunction( 'data', [
						'var data2 = data.locale_data;',
						'var localeData = data2[ textdomain ] || data2.messages;',
						'localeData[""].domain = textdomain;',
						'i18n.setLocaleData( localeData, textdomain );',
					] ) + ' );',
				] ) + ';',
			'',
			'var installedChunks = {};',
			`${ RuntimeGlobals.ensureChunkHandlers }.wpI18n = ` + runtimeTemplate.basicFunction( 'chunkId, promises', [
				'if ( installedChunks[chunkId] ) {',
				Template.indent( 'promises.push( installedChunks[chunkId] );' ),
				'} else if ( installedChunks[chunkId] !== 0 && chunkInfo[chunkId] ) {',
				Template.indent( [
					'promises.push( installedChunks[chunkId] = loadI18n( chunkInfo[chunkId] ).then( ',
					Template.indent( [
						runtimeTemplate.basicFunction( '', [ 'installedChunks[chunkId] = 0;' ] ) + ',',
						runtimeTemplate.basicFunction( 'e', [
							'delete installedChunks[chunkId];',
							"// Log only, we don't want i18n failure to break the entire page.",
							'console.error( "Failed to fetch i18n data:", e );',
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

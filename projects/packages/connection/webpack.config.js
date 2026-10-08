const path = require( 'path' );
const jetpackWebpackConfig = require( '@automattic/jetpack-webpack-config/webpack' );
const {
	defaultRequestToExternal,
	defaultRequestToHandle,
} = require( '@wordpress/dependency-extraction-webpack-plugin/lib/util' );
const { glob } = require( 'glob' );

// Module-only packages, loaded through the import map rather than as classic script globals.
// defaultRequestToExternal() would map them to a `wp.*` global that core never defines.
const AS_MODULE = new Set( [
	'@wordpress/connectors',
	'@wordpress/interactivity',
	'@wordpress/interactivity-router',
	'@wordpress/a11y',
	'@wordpress/boot',
	'@wordpress/route',
	'@wordpress/widget-primitives',
] );

// Shared scripts the wrapper's requestMap externalizes but connectorsCardExternal() doesn't; bundling one loads a second copy.
const UNMAPPED_SHARED_SCRIPTS = new Set( [
	'@automattic/jetpack-script-data',
	'@automattic/jetpack-shared-stores',
] );

/**
 * External for a request from the Connectors card, with the classic script handle it needs.
 *
 * Mirrors the jetpack-connection entry of the wrapper's `requestMap`, which this entry can't use without DependencyExtractionPlugin.
 *
 * @see projects/js-packages/webpack-config/src/webpack.js
 * @see https://github.com/WordPress/gutenberg/blob/485f42ae8a1c58ceea18371a507fd4acfa86fbd8/packages/dependency-extraction-webpack-plugin/lib/util.js#L86-L109
 *
 * @param {string} request - Module request.
 * @return {{external: string, handle?: string}|undefined} External with its type prefix, or undefined to bundle the request.
 */
const connectorsCardExternal = request => {
	// module-import: webpack picks `module` for a static import and `import` for an import() call.
	if ( AS_MODULE.has( request ) ) {
		return { external: `module-import ${ request }` };
	}
	// Resolves to the shared jetpack-connection script, so js-packages/connection imports add nothing here.
	if ( request === '@automattic/jetpack-connection' ) {
		return { external: 'var JetpackConnection', handle: 'jetpack-connection' };
	}
	// A subpath would be bundled instead, since only the package root maps to the shared script.
	if ( request.startsWith( '@automattic/jetpack-connection/' ) ) {
		throw new Error(
			`Import ${ request } from '@automattic/jetpack-connection' instead, so it comes from the shared jetpack-connection script.`
		);
	}
	if ( UNMAPPED_SHARED_SCRIPTS.has( request ) ) {
		throw new Error(
			`Map ${ request } to its shared script in connectorsCardExternal() before the Connectors card imports it.`
		);
	}
	// defaultRequestToExternal() returns undefined for packages meant to be bundled.
	const global = defaultRequestToExternal( request );
	if ( ! global ) {
		return undefined;
	}
	return {
		external: `var ${ [].concat( global ).join( '.' ) }`,
		handle: defaultRequestToHandle( request ) ?? request,
	};
};

/**
 * Externalizes the Connectors card's imports and writes its asset file, in place of DependencyExtractionPlugin.
 *
 * Core needs classic script handles and script module IDs apart, which the plugin's module mode lists together.
 * Adapted from PolyfillModulePlugin in packages/wp-build-polyfills/webpack.config.js.
 */
class ConnectorsCardAssetPlugin {
	/**
	 * Apply the plugin.
	 *
	 * @param {import('webpack').Compiler} compiler - Webpack compiler.
	 */
	apply( compiler ) {
		const { webpack } = compiler;
		const name = 'ConnectorsCardAssetPlugin';

		// 1. Keep each import out of the bundle; the external's type prefix (module-import or var) says how it loads.
		new webpack.ExternalsPlugin( 'import', ( { request }, callback ) => {
			let external;
			try {
				external = connectorsCardExternal( request )?.external;
			} catch ( error ) {
				return callback( error );
			}
			callback( null, external );
		} ).apply( compiler );

		// 2. Once the bundle is minified, write the asset file beside each entry's JS.
		compiler.hooks.thisCompilation.tap( name, compilation => {
			compilation.hooks.processAssets.tap(
				{ name, stage: webpack.Compilation.PROCESS_ASSETS_STAGE_ANALYSE },
				() => {
					for ( const [ , entrypoint ] of compilation.entrypoints ) {
						const chunk = entrypoint.getEntrypointChunk();
						const jsFile = Array.from( chunk.files ).find( file => /\.m?js$/i.test( file ) );
						if ( ! jsFile ) {
							continue;
						}
						compilation.emitAsset(
							jsFile.replace( /\.m?js$/i, '.asset.php' ),
							new webpack.sources.RawSource( this.assetFile( compilation, chunk, jsFile ) )
						);
					}
				}
			);
		} );
	}

	/**
	 * Build the asset file for an entry chunk from the external modules it uses.
	 *
	 * @param {import('webpack').Compilation} compilation - Webpack compilation.
	 * @param {import('webpack').Chunk}       chunk       - Entry chunk.
	 * @param {string}                        jsFile      - Emitted JS file of the chunk.
	 * @return {string} PHP source of the asset file.
	 */
	assetFile( compilation, chunk, jsFile ) {
		const { webpack } = compilation.compiler;
		const handles = new Set();
		const modules = new Map();

		for ( const module of compilation.chunkGraph.getChunkModulesIterable( chunk ) ) {
			if ( ! ( module instanceof webpack.ExternalModule ) ) {
				continue;
			}
			const { userRequest: request, externalType, dependencyMeta } = module;
			// module-import externals are script modules; var externals are classic scripts.
			if ( externalType === 'module-import' ) {
				const kind = dependencyMeta?.externalType === 'import' ? 'dynamic' : 'static';
				// A static import wins when the card imports the same module both ways.
				if ( kind === 'static' || ! modules.has( request ) ) {
					modules.set( request, kind );
				}
				continue;
			}
			const handle = connectorsCardExternal( request )?.handle;
			if ( handle ) {
				handles.add( handle );
			}
		}

		const php = value => `'${ String( value ).replace( /[\\']/g, '\\$&' ) }'`;
		const dependencies = [ ...handles ].sort().map( php );
		const moduleDependencies = [ ...modules ]
			.sort( ( [ a ], [ b ] ) => a.localeCompare( b ) )
			.map( ( [ id, kind ] ) => `array('id' => ${ php( id ) }, 'import' => ${ php( kind ) })` );
		const version = webpack.util
			.createHash( 'xxhash64' )
			.update( compilation.getAsset( jsFile ).source.buffer() )
			.digest( 'hex' )
			.slice( 0, 16 );

		// Read by Jetpack_Connector::get_module_asset().
		return `<?php return array('dependencies' => array(${ dependencies.join(
			', '
		) }), 'module_dependencies' => array(${ moduleDependencies.join(
			', '
		) }), 'version' => ${ php( version ) }, 'type' => 'module');\n`;
	}
}

const ssoEntries = {};
// Add all js files in the src/sso directory.
for ( const file of glob.sync( './src/sso/*.js' ) ) {
	const name = path.basename( file, path.extname( file ) );
	ssoEntries[ name ] ??= [];
	ssoEntries[ name ].push( path.resolve( file ) );
}
// Add all css files as well.
for ( const file of glob.sync( './src/sso/*.css' ) ) {
	const name = path.basename( file, path.extname( file ) );
	ssoEntries[ name ] ??= [];
	ssoEntries[ name ].push( path.resolve( file ) );
}

/**
 * @type {import('webpack').Configuration[]} Webpack configuration.
 */
const sharedConfig = {
	mode: jetpackWebpackConfig.mode,
	devtool: jetpackWebpackConfig.devtool,
	output: {
		...jetpackWebpackConfig.output,
		path: path.resolve( './dist' ),
	},
	optimization: {
		...jetpackWebpackConfig.optimization,
	},
	resolve: {
		...jetpackWebpackConfig.resolve,
	},
	node: false,
	module: {
		strictExportPresence: true,
		rules: [
			// Transpile JavaScript, including node_modules.
			jetpackWebpackConfig.TranspileRule(),

			// Transpile @automattic/jetpack-* in node_modules too.
			jetpackWebpackConfig.TranspileRule( {
				includeNodeModules: [ '@automattic/jetpack-' ],
			} ),

			// Handle CSS.
			jetpackWebpackConfig.CssRule( {
				extensions: [ 'css', 'sass', 'scss' ],
				extraLoaders: [ { loader: 'sass-loader', options: { api: 'modern-compiler' } } ],
			} ),
			// Handle images.
			jetpackWebpackConfig.FileRule(),
		],
	},
	externals: {
		...jetpackWebpackConfig.externals,
		jetpackConfig: JSON.stringify( {
			consumer_slug: 'connection_package',
		} ),
	},
};

/**
 * @type {import('webpack').Configuration[]} Webpack configuration.
 */
module.exports = [
	{
		...sharedConfig,
		entry: {
			'tracks-ajax': './src/js/tracks-ajax.js',
			'tracks-callables': {
				import: './src/js/tracks-callables.js',
				library: {
					name: 'analytics',
					type: 'window',
				},
			},
			'identity-crisis': './src/identity-crisis/_inc/admin.jsx',
			'jetpack-users-connection': './src/js/jetpack-users-connection.js',
			...ssoEntries,
		},
		plugins: [
			...jetpackWebpackConfig.StandardPlugins( {
				MiniCssExtractPlugin: { filename: '[name].css' },
			} ),
		],
	},
	{
		...sharedConfig,
		entry: {
			'jetpack-connection': {
				import: './src/js/jetpack-connection.js',
				library: {
					name: 'JetpackConnection',
					type: 'umd',
				},
			},
		},
		plugins: [
			...jetpackWebpackConfig.StandardPlugins( {
				MiniCssExtractPlugin: { filename: '[name].css' },
				DependencyExtractionPlugin: {
					requestMap: {
						// We don't want to externalize this package, we rather want to bundle it.
						'@automattic/jetpack-connection': {},
					},
				},
			} ),
		],
	},
	{
		...sharedConfig,
		entry: {
			'connectors-card': './src/connectors/js/connectors-card.js',
		},
		output: {
			...jetpackWebpackConfig.output,
			path: path.resolve( './dist/connectors' ),
			module: true,
			// Inlines any dynamic import() instead of emitting a lazy-loaded file, because the PHP
			// registers and versions connectors-card.js only.
			asyncChunks: false,
		},
		// Not sharedConfig.externals: with module output an unprefixed external is read as a module specifier.
		externals: {
			jetpackConfig: `var ${ JSON.stringify( { consumer_slug: 'connection_package' } ) }`,
		},
		plugins: [
			...jetpackWebpackConfig.StandardPlugins( {
				DependencyExtractionPlugin: false,
				// It only handles lazy-loaded chunks, and this entry has none.
				I18nLoaderPlugin: false,
			} ),
			new ConnectorsCardAssetPlugin(),
		],
	},
];

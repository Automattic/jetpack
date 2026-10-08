const path = require( 'path' );
const jetpackWebpackConfig = require( '@automattic/jetpack-webpack-config/webpack' );
const {
	defaultRequestToExternal,
} = require( '@wordpress/dependency-extraction-webpack-plugin/lib/util' );
const { glob } = require( 'glob' );

// Module-only packages, imported statically through the import map. Any the card imports must also be
// in Jetpack_Connector::MODULE_DEPENDENCIES, or the import map won't contain it at runtime.
const AS_MODULE = new Set( [
	'@wordpress/connectors',
	'@wordpress/interactivity',
	'@wordpress/interactivity-router',
	'@wordpress/a11y',
	'@wordpress/boot',
	'@wordpress/route',
	'@wordpress/widget-primitives',
] );

/**
 * Externals for the Connectors card script module.
 *
 * In module mode the wrapper's `requestMap` is ignored, so the shared mapping is repeated here.
 *
 * @param {string} request - Module request.
 * @return {string|false} External with its type prefix, or false to bundle the request.
 */
const connectorsCardRequestToExternalModule = request => {
	if ( AS_MODULE.has( request ) ) {
		return `module ${ request }`;
	}
	// Resolves to the shared jetpack-connection script, so js-packages/connection imports add nothing here.
	if ( request === '@automattic/jetpack-connection' ) {
		return 'var JetpackConnection';
	}
	// A subpath would be bundled instead, since only the package root maps to the shared script.
	if ( request.startsWith( '@automattic/jetpack-connection/' ) ) {
		throw new Error(
			`Import ${ request } from '@automattic/jetpack-connection' instead, so it comes from the shared jetpack-connection script.`
		);
	}
	// A classic script global for WordPress scripts and React; undefined for packages meant to be bundled.
	const global = defaultRequestToExternal( request );
	if ( ! global ) {
		return false;
	}
	return `var ${ Array.isArray( global ) ? global.join( '.' ) : global }`;
};

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
				DependencyExtractionPlugin: {
					requestToExternalModule: connectorsCardRequestToExternalModule,
				},
				// It only handles lazy-loaded chunks, and this entry has none.
				I18nLoaderPlugin: false,
			} ),
		],
	},
];

const path = require( 'path' );
const jetpackWebpackConfig = require( '@automattic/jetpack-webpack-config/webpack' );
const { glob } = require( 'glob' );

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
];

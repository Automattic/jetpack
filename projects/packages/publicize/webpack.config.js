const path = require( 'path' );
const jetpackWebpackConfig = require( '@automattic/jetpack-webpack-config/webpack' );

const isServe = process.env.WEBPACK_SERVE === 'true';

const socialWebpackConfig = {
	mode: jetpackWebpackConfig.mode,
	devtool: jetpackWebpackConfig.devtool,
	output: {
		...jetpackWebpackConfig.output,
		path: path.resolve( './build' ),
	},
	optimization: {
		...jetpackWebpackConfig.optimization,
	},
	resolve: {
		...jetpackWebpackConfig.resolve,
	},
	node: false,
	plugins: [ ...jetpackWebpackConfig.StandardPlugins() ],
	module: {
		strictExportPresence: true,
		rules: [
			// Transpile JavaScript
			jetpackWebpackConfig.TranspileRule( {
				exclude: /node_modules\//,
			} ),

			// Transpile @automattic/* in node_modules too.
			jetpackWebpackConfig.TranspileRule( {
				includeNodeModules: [ '@automattic/' ],
			} ),
			// Handle CSS.
			jetpackWebpackConfig.CssRule( {
				extensions: [ 'css', 'sass', 'scss' ],
				extraLoaders: [
					{
						loader: 'postcss-loader',
						options: {
							postcssOptions: { config: path.join( __dirname, 'postcss.config.js' ) },
						},
					},
					{ loader: 'sass-loader', options: { api: 'modern-compiler' } },
				],
			} ),

			// Handle images.
			jetpackWebpackConfig.FileRule(),
		],
	},
	externals: {
		...jetpackWebpackConfig.externals,
		jetpackConfig: JSON.stringify( {
			consumer_slug: 'jetpack-social',
		} ),
	},
};

// Dev server config - only applied to one configuration to avoid port conflicts
const devServerConfig = jetpackWebpackConfig.DevServer( {
	static: {
		directory: path.resolve( './build' ),
	},
} );

module.exports = [
	{
		...socialWebpackConfig,
		entry: {
			'classic-editor': './_inc/entry-points/classic-editor.js',
		},
	},
	{
		...socialWebpackConfig,
		entry: {
			'social-admin-page': './_inc/entry-points/social-admin-page.tsx',
			'block-editor-jetpack': './_inc/entry-points/block-editor-jetpack.tsx',
			'block-editor-social': './_inc/entry-points/block-editor-social.tsx',
		},
		// Only add devServer to one config to avoid port conflicts
		...( isServe && { devServer: devServerConfig } ),
	},
];

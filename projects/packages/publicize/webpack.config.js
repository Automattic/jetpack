const path = require( 'path' );
const jetpackWebpackConfig = require( '@automattic/jetpack-webpack-config/webpack' );

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
			// Old Gutenberg packages' ESM builds don't fully specify their imports. Sigh.
			// @todo Remove this when we upgrade @wordpress/dataviews to 11.2.0+.
			// https://github.com/WordPress/gutenberg/issues/73362
			{
				test: /\/node_modules\/@wordpress\/.*\/build-module\/.*\.js$/,
				resolve: { fullySpecified: false },
			},

			// Transpile JavaScript
			jetpackWebpackConfig.TranspileRule( {
				exclude: /node_modules\//,
			} ),

			// Transpile @automattic/jetpack-* in node_modules too.
			jetpackWebpackConfig.TranspileRule( {
				includeNodeModules: [ '@automattic/jetpack-' ],
			} ),

			// Add textdomains (but no other optimizations) for @wordpress/dataviews and its dependencies.
			jetpackWebpackConfig.TranspileRule( {
				includeNodeModules: [ '@wordpress/dataviews/' ],
				babelOpts: {
					configFile: false,
					plugins: [
						[
							require.resolve( '@automattic/babel-plugin-replace-textdomain' ),
							{ textdomain: 'jetpack-publicize-pkg' },
						],
					],
				},
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
	},
];

const path = require( 'path' );
const jetpackConfig = require( '@automattic/jetpack-webpack-config/webpack' );
const webpack = require( 'webpack' );

const babelOpts = {
	plugins: [
		[
			'@babel/plugin-transform-react-jsx',
			{
				pragma: 'h',
				pragmaFrag: 'Fragment',
				runtime: 'classic',
				useSpread: true,
			},
		],
	],
	targets: require( '@automattic/jetpack-webpack-config/targets' ),
	presets: [ [ '@automattic/jetpack-webpack-config/babel/preset' ] ],
};

module.exports = [
	{
		entry: {
			verbum: './src/comment-form/index.tsx',
		},
		mode: jetpackConfig.mode,
		devtool: jetpackConfig.devtool,
		output: {
			...jetpackConfig.output,
			filename: '[name].js',
			path: path.resolve( __dirname, 'build' ),
			chunkFilename: '[name].js',
			environment: {
				module: true,
				dynamicImport: true,
			},
		},
		optimization: {
			...jetpackConfig.optimization,
			splitChunks: {
				cacheGroups: {
					// Split out hovercards
					verbumComments: {
						name: 'verbum-gravatar',
						test: /[\\/]node_modules[\\/](@gravatar-com)[\\/]hovercards[\\/]dist[\\/].*?\.(js|mjs)/,
						chunks: 'all',
						enforce: true,
					},
				},
			},
		},
		resolve: {
			...jetpackConfig.resolve,
		},
		node: false,
		plugins: [
			...jetpackConfig.StandardPlugins(),
			new webpack.ProvidePlugin( {
				h: [ 'preact', 'h' ],
				Fragment: [ 'preact', 'Fragment' ],
			} ),
		],
		module: {
			strictExportPresence: true,
			rules: [
				// Transpile JavaScript.
				jetpackConfig.TranspileRule( {
					exclude: /node_modules\//,
					babelOpts,
				} ),

				// Transpile @automattic/jetpack-* in node_modules too.
				jetpackConfig.TranspileRule( {
					includeNodeModules: [ '@automattic/jetpack-' ],
				} ),

				// preact has some `__` internal methods, which confuse i18n-check-webpack-plugin. Hack around that.
				jetpackConfig.TranspileRule( {
					includeNodeModules: [ 'preact' ],
					babelOpts: {
						configFile: false,
						plugins: [ [ 'babel-plugin-transform-rename-properties', { rename: { __: '__ǃ' } } ] ],
						presets: [],
					},
				} ),

				// Handle CSS.
				jetpackConfig.CssRule( {
					extensions: [ 'css', 'scss' ],
					extraLoaders: [
						{
							loader: 'postcss-loader',
							options: {
								postcssOptions: {
									config: path.join( __dirname, 'postcss.config.js' ),
								},
							},
						},
						{ loader: 'sass-loader', options: { api: 'modern-compiler' } },
					],
				} ),

				// Handle images.
				jetpackConfig.FileRule(),
			],
		},
	},
	{
		entry: {
			'dynamic-loader': './src/comment-form/dynamic-loader.js',
			moderation: './src/moderation/moderation.js',
		},
		mode: jetpackConfig.mode,
		devtool: jetpackConfig.devtool,
		output: {
			...jetpackConfig.output,
			path: path.resolve( __dirname, 'build' ),
		},
		optimization: {
			...jetpackConfig.optimization,
		},
		resolve: {
			...jetpackConfig.resolve,
		},
		node: false,
		plugins: [ ...jetpackConfig.StandardPlugins() ],
		module: {
			strictExportPresence: true,
			rules: [
				// Transpile JavaScript.
				jetpackConfig.TranspileRule( {
					exclude: /node_modules\//,
					babelOpts,
				} ),

				// Transpile @automattic/jetpack-* in node_modules too.
				jetpackConfig.TranspileRule( {
					includeNodeModules: [ '@automattic/jetpack-' ],
				} ),
			],
		},
	},
];

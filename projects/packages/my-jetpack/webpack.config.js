import path from 'path';
import jetpackWebpackConfig from '@automattic/jetpack-webpack-config/webpack';

const __dirname = import.meta.dirname;

export default [
	{
		entry: {
			// The public path goes first, so it is set before anything loads a chunk.
			onboarding: [ './_inc/public-path.ts', './_inc/onboarding.jsx' ],
			'async-notification-bubble': './_inc/utils/async-notification-bubble.ts',
			'header-controls': './_inc/header-controls-script.tsx',
		},
		mode: jetpackWebpackConfig.mode,
		devtool: jetpackWebpackConfig.devtool,
		output: {
			...jetpackWebpackConfig.output,
			path: path.resolve( './build' ),
		},
		optimization: {
			...jetpackWebpackConfig.optimization,
			// Keeps the wizard's node_modules in its own chunk rather than a second, numbered one.
			splitChunks: { cacheGroups: { defaultVendors: false } },
		},
		resolve: {
			...jetpackWebpackConfig.resolve,
		},
		node: false,
		plugins: [
			...jetpackWebpackConfig.StandardPlugins( {
				DependencyExtractionPlugin: {
					bundleWpUiDeps: true,
				},
			} ),
		],
		module: {
			strictExportPresence: true,
			rules: [
				// Transpile JavaScript
				jetpackWebpackConfig.TranspileRule( {
					exclude: /node_modules\//,
				} ),

				// Transpile @automattic/jetpack-* in node_modules too.
				jetpackWebpackConfig.TranspileRule( {
					includeNodeModules: [ '@automattic/jetpack-' ],
				} ),

				// Workarounds for non-extracted `@wordpress/*` packages.
				...jetpackWebpackConfig.BundledWpPkgsTranspileRules(),

				// Handle CSS.
				jetpackWebpackConfig.CssRule( {
					extensions: [ 'css', 'sass', 'scss' ],
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
				jetpackWebpackConfig.FileRule(),
			],
		},
		externals: {
			...jetpackWebpackConfig.externals,
			jetpackConfig: JSON.stringify( {
				consumer_slug: 'my_jetpack',
			} ),
		},
		devServer: jetpackWebpackConfig.DevServer( {
			static: { directory: path.resolve( './build' ) },
		} ),
	},
];

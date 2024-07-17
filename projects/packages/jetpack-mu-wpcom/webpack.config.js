// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require( 'path' );
const jetpackWebpackConfig = require( '@automattic/jetpack-webpack-config/webpack' );
const verbumConfig = require( './verbum.webpack.config.js' );

module.exports = [
	...verbumConfig,
	{
		entry: {
			'a8c-posts-list': './src/features/wpcom-blocks/a8c-posts-list/blocks/posts-list/index.js',
			'block-inserter-modifications': './src/features/block-inserter-modifications/index.js',
			'block-theme-previews': './src/features/block-theme-previews/index.js',
			'core-customizer-css':
				'./src/features/custom-css/custom-css/js/core-customizer-css.core-4.9.js',
			'core-customizer-css-preview':
				'./src/features/custom-css/custom-css/js/core-customizer-css-preview.js',
			'customizer-control': './src/features/custom-css/custom-css/css/customizer-control.css',
			'error-reporting': './src/features/error-reporting/index.js',
			'jetpack-global-styles': './src/features/jetpack-global-styles/index.js',
			'jetpack-global-styles-customizer-fonts':
				'./src/features/jetpack-global-styles/customizer-fonts/index.js',
			'mailerlite-subscriber-popup': './src/features/mailerlite/subscriber-popup.js',
			'override-preview-button-url':
				'./src/features/override-preview-button-url/override-preview-button-url.js',
			'paragraph-block-placeholder':
				'./src/features/paragraph-block-placeholder/paragraph-block-placeholder.js',
			'tags-education': './src/features/tags-education/tags-education.js',
			'wpcom-admin-bar': './src/features/wpcom-admin-bar/wpcom-admin-bar.scss',
			'wpcom-blocks-event-countdown-editor':
				'./src/features/wpcom-blocks/event-countdown/editor.js',
			'wpcom-blocks-event-countdown-view': './src/features/wpcom-blocks/event-countdown/view.js',
			'wpcom-blocks-timeline-editor': './src/features/wpcom-blocks/timeline/editor.js',
			'wpcom-blocks-timeline-view': './src/features/wpcom-blocks/timeline/view.js',
			'wpcom-block-description-links': './src/features/wpcom-block-description-links/index.tsx',
			'wpcom-sidebar-notice': './src/features/wpcom-sidebar-notice/wpcom-sidebar-notice.scss',
			'wpcom-documentation-links':
				'./src/features/wpcom-documentation-links/wpcom-documentation-links.ts',
		},
		mode: jetpackWebpackConfig.mode,
		devtool: jetpackWebpackConfig.devtool,
		output: {
			...jetpackWebpackConfig.output,
			filename: '[name]/[name].js',
			path: path.resolve( __dirname, 'src/build' ),
		},
		optimization: {
			...jetpackWebpackConfig.optimization,
		},
		resolve: {
			...jetpackWebpackConfig.resolve,
			alias: {
				...jetpackWebpackConfig.resolve.alias,
				'@automattic/calypso-config': '@automattic/calypso-config/src/client.js',
			},
		},
		node: false,
		plugins: [
			...jetpackWebpackConfig.StandardPlugins( {
				MiniCssExtractPlugin: { filename: '[name]/[name].css' },
			} ),
		],
		module: {
			strictExportPresence: true,
			rules: [
				// Transpile JavaScript.
				jetpackWebpackConfig.TranspileRule( {
					exclude: /node_modules\//,
				} ),

				// Transpile @automattic/jetpack-* in node_modules too.
				jetpackWebpackConfig.TranspileRule( {
					includeNodeModules: [ '@automattic/jetpack-' ],
				} ),

				// Handle CSS.
				jetpackWebpackConfig.CssRule( {
					extensions: [ 'css', 'scss' ],
					extraLoaders: [ 'sass-loader' ],
				} ),

				// Handle images.
				jetpackWebpackConfig.FileRule(),
			],
		},
		externals: {
			...jetpackWebpackConfig.externals,
			jetpackConfig: JSON.stringify( {
				consumer_slug: 'jetpack-mu-wpcom',
			} ),
		},
	},
];

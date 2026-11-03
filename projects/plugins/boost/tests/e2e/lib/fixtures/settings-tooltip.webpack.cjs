const path = require( 'node:path' );
const config = require( '@automattic/jetpack-webpack-config/webpack' );

const pluginRoot = path.join( __dirname, '../../../../' );

// The plugin build externalizes this to a single `wp.components`; bundling it here
// would otherwise give the plugin and js-packages/components separate copies, and
// separate copies of the slot-fill context the popover slot needs.
const wpComponents = path.dirname(
	require.resolve( '@wordpress/components/package.json', { paths: [ pluginRoot ] } )
);

module.exports = {
	mode: 'development',
	devtool: false,
	entry: path.join( __dirname, 'settings-tooltip-entry.jsx' ),
	output: { filename: 'settings-tooltip.js' },
	resolve: {
		...config.resolve,
		conditionNames: [ 'jetpack:src', '...' ],
		alias: {
			...config.resolve.alias,
			'@wordpress/components$': wpComponents,
			$lib: path.join( pluginRoot, 'app/assets/src/js/lib' ),
			$features: path.join( pluginRoot, 'app/assets/src/js/features' ),
			$layout: path.join( pluginRoot, 'app/assets/src/js/layout' ),
			$svg: path.join( pluginRoot, 'app/assets/src/js/svg' ),
			$css: path.join( pluginRoot, 'app/assets/src/css' ),
			$images: path.join( pluginRoot, 'app/assets/static/images' ),
			// The real Settings page pulls in every module store; the fixture keeps the
			// card shape it renders and swaps the modules for the tooltips under test.
			[ path.join( pluginRoot, 'app/assets/src/js/pages/settings/settings.tsx' ) ]: path.join(
				__dirname,
				'settings-tooltip-cards.jsx'
			),
			[ path.join(
				pluginRoot,
				'app/assets/src/js/features/upgrade-cta/interstitial-modal-cta.tsx'
			) ]: path.join( __dirname, 'settings-tooltip-upgrade-cta.jsx' ),
		},
		fallback: { ...config.resolve.fallback, url: false, https: false, http: false, os: false },
	},
	plugins: config.StandardPlugins( {
		DependencyExtractionPlugin: false,
		I18nLoaderPlugin: false,
		MiniCssExtractPlugin: { filename: 'settings-tooltip.css' },
	} ),
	externals: {
		...config.externals,
		jetpackConfig: JSON.stringify( { consumer_slug: 'jetpack-boost' } ),
	},
	module: {
		rules: [
			config.TranspileRule( { exclude: /node_modules\// } ),
			config.TranspileRule( { includeNodeModules: [ '@automattic/jetpack-' ] } ),
			...config.BundledWpPkgsTranspileRules( { textdomain: 'jetpack-boost' } ),
			config.CssRule( {
				extensions: [ 'css', 'sass', 'scss' ],
				extraLoaders: [
					{
						loader: 'postcss-loader',
						options: {
							postcssOptions: { config: path.join( pluginRoot, 'postcss.config.js' ) },
						},
					},
					{ loader: 'sass-loader', options: { api: 'modern-compiler' } },
				],
			} ),
			config.FileRule(),
		],
	},
};

/**
 * This takes care of minifying CSS for the legacy contact-form bundle which leads its own life.
 *
 * This config is based on plugins/jetpack/tools/webpack.config.css.js, at the time of the migration to a separate package.
 */

const path = require( 'path' );
const jetpackWebpackConfig = require( '@automattic/jetpack-webpack-config/webpack' );
const RemoveAssetWebpackPlugin = require( '@automattic/remove-asset-webpack-plugin' );

const webpack = jetpackWebpackConfig.webpack;
const sharedWebpackConfig = {
	mode: jetpackWebpackConfig.mode,
	devtool: jetpackWebpackConfig.isDevelopment ? 'source-map' : false,
	output: {
		...jetpackWebpackConfig.output,
		path: path.join( __dirname, '..' ),
	},
	optimization: {
		...jetpackWebpackConfig.optimization,
	},
	resolve: {
		...jetpackWebpackConfig.resolve,
		modules: [ 'node_modules' ],
		alias: {
			...jetpackWebpackConfig.resolve.alias,
			fs: false,
		},
	},
	node: {},
	externals: {
		...jetpackWebpackConfig.externals,
		jetpackConfig: JSON.stringify( {
			consumer_slug: 'jetpack',
		} ),
	},
	module: {
		strictExportPresence: true,
		rules: [
			// Handle CSS.
			jetpackWebpackConfig.CssRule( {
				extensions: [ 'css', 'sass', 'scss' ],
				extraLoaders: [
					{
						loader: 'postcss-loader',
						options: {
							postcssOptions: { plugins: { autoprefixer: {} } },
						},
					},
					{
						loader: 'sass-loader',
						options: {
							sassOptions: {
								// The minifier will minify if necessary.
								outputStyle: 'expanded',
							},
						},
					},
				],
			} ),

			// Leave fonts and images in place.
			{
				test: /\.(eot|ttf|woff|png|svg)$/i,
				type: 'asset/resource',
				generator: {
					emit: false,
					filename: '[file]',
				},
			},
		],
	},
	plugins: [
		...jetpackWebpackConfig.StandardPlugins( {
			DependencyExtractionPlugin: false,
			I18nLoaderPlugin: false,
			I18nCheckPlugin: false,
		} ),
		// Delete the dummy JS files Webpack would otherwise create.
		new RemoveAssetWebpackPlugin( {
			assets: /\.js(\.map)?$/,
		} ),
	],
};

// A bunch of the CSS here expects the RTL version to be named like "module-rtl.css" and "module-rtl.min.css"
// rather than "module.rtl.css" and "module.min.rtl.css" like our Webpack config does it.
// This minimal plugin renames the assets to conform to that style.
const RenamerPlugin = {
	apply( compiler ) {
		compiler.hooks.thisCompilation.tap( 'Renamer', compilation => {
			compilation.hooks.processAssets.tap(
				{
					name: 'Renamer',
					stage: webpack.Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE_INLINE,
					additionalAssets: true,
				},
				assets => {
					for ( const [ name, asset ] of Object.entries( assets ) ) {
						const m = name.match( /^(.*?)((?:\.min)?)\.rtl\.css$/ );
						if ( m ) {
							delete assets[ name ];
							assets[ `${ m[ 1 ] }-rtl${ m[ 2 ] }.css` ] = asset;
						}
					}
				}
			);
		} );
	},
};

// CSS that needs to have the rtl files renamed using the above RenamerPlugin.
const weirdRtlEntries = {
	'css/jetpack': [
		// When making changes to that list, you must also update $concatenated_style_handles in class.jetpack.php.
		'src/contact-form/css/grunion.css',
	].map( n => path.join( __dirname, '..', n ) ),
};

// Non-minified CSS, that also needs to have the rtl files renamed using the above RenamerPlugin.
const weirdRtlNominEntries = {};

// Admin CSS files to insert into weirdRtlNominEntries and weirdRtlEntries.
for ( const name of [
	'src/contact-form/css/editor-inline-editing-style',
	'src/contact-form/css/editor-style',
	'src/contact-form/css/editor-ui',
] ) {
	weirdRtlNominEntries[ name ] = path.join( __dirname, '..', name + '.css' );
	weirdRtlEntries[ name + '.min' ] = path.join( __dirname, '..', name + '.css' );
}

// Weird frontend CSS files, only a minified rtl is built (and without the ".min" extension).
// The ltr version is apparently used unminified.
for ( const name of [ 'src/contact-form/css/grunion' ] ) {
	weirdRtlEntries[ name ] = path.join( __dirname, '..', name + '.css' );
}

module.exports = [
	{
		...sharedWebpackConfig,
		entry: weirdRtlEntries,
		plugins: [
			...sharedWebpackConfig.plugins,
			// In some cases an output filename is the same as the input. Don't overwrite in that case.
			new RemoveAssetWebpackPlugin( {
				assets: Object.values( weirdRtlEntries )
					.filter( n => typeof n === 'string' )
					.map( n => path.relative( path.dirname( __dirname ), n ) ),
			} ),
			RenamerPlugin,
		],
	},
	{
		...sharedWebpackConfig,
		entry: weirdRtlNominEntries,
		optimization: {
			...sharedWebpackConfig.optimization,
			minimize: false,
		},
		plugins: [
			...sharedWebpackConfig.plugins,
			// In some cases an output filename is the same as the input. Don't overwrite in that case.
			new RemoveAssetWebpackPlugin( {
				assets: Object.values( weirdRtlNominEntries )
					.filter( n => typeof n === 'string' )
					.map( n => path.relative( path.dirname( __dirname ), n ) ),
			} ),
			RenamerPlugin,
		],
	},
];

/**
 * This takes care of minifying CSS for the legacy contact-form bundle which leads its own life.
 *
 * This config is based on plugins/jetpack/tools/webpack.config.css.js, at the time of the migration to a separate package.
 */

const path = require( 'path' );
const jetpackWebpackConfig = require( '@automattic/jetpack-webpack-config/webpack' );
const RemoveAssetWebpackPlugin = require( '@automattic/remove-asset-webpack-plugin' );
const glob = require( 'glob' );

const scriptSrcDir = path.join( __dirname, '../src/contact-form/js' );

const sharedWebpackConfig = {
	mode: jetpackWebpackConfig.mode,
	devtool: jetpackWebpackConfig.devtool,
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
			consumer_slug: 'jetpack-forms',
		} ),
	},
	module: {
		strictExportPresence: true,
		rules: [
			// Transpile JavaScript
			jetpackWebpackConfig.TranspileRule( {
				exclude: /node_modules\//,
			} ),

			// Handle CSS.
			jetpackWebpackConfig.CssRule( {
				extensions: [ 'css', 'sass', 'scss' ],
				extraLoaders: [
					{
						loader: 'postcss-loader',
						options: {
							postcssOptions: { plugins: [ require( 'autoprefixer' ) ] },
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
			assets: name =>
				name.startsWith( 'src/contact-form/css' ) &&
				( name.endsWith( '.js' ) || name.endsWith( 'map' ) ),
		} ),
	],
};

// Entries to minify
const entries = {};

// Entries to not minify
const nominEntries = {};

// Admin CSS files to insert into weirdRtlNominEntries and weirdRtlEntries.
for ( const name of [
	'src/contact-form/css/editor-inline-editing-style',
	'src/contact-form/css/editor-style',
	'src/contact-form/css/editor-ui',
] ) {
	entries[ name ] = path.join( __dirname, '..', name + '.css' );
	nominEntries[ name + '.min' ] = path.join( __dirname, '..', name + '.css' );
}

// Weird frontend CSS files, only a minified rtl is built (and without the ".min" extension).
// The ltr version is apparently used unminified.
for ( const name of [ 'src/contact-form/css/grunion' ] ) {
	entries[ name ] = path.join( __dirname, '..', name + '.css' );
}

module.exports = [
	{
		...sharedWebpackConfig,
		entry: entries,
		plugins: [
			...sharedWebpackConfig.plugins,
			// In some cases an output filename is the same as the input. Don't overwrite in that case.
			new RemoveAssetWebpackPlugin( {
				assets: Object.values( entries )
					.filter( n => typeof n === 'string' )
					.map( n => path.relative( path.dirname( __dirname ), n ) ),
			} ),
		],
	},
	{
		...sharedWebpackConfig,
		entry: nominEntries,
		optimization: {
			...sharedWebpackConfig.optimization,
			minimize: false,
		},
		plugins: [
			...sharedWebpackConfig.plugins,
			// In some cases an output filename is the same as the input. Don't overwrite in that case.
			new RemoveAssetWebpackPlugin( {
				assets: Object.values( nominEntries )
					.filter( n => typeof n === 'string' )
					.map( n => path.relative( path.dirname( __dirname ), n ) ),
			} ),
		],
	},
	{
		...sharedWebpackConfig,
		entry: glob.sync( path.join( scriptSrcDir, '*.js' ) ).reduce( ( acc, filepath ) => {
			acc[ 'js/' + path.parse( filepath ).name ] = filepath;
			return acc;
		}, {} ),
		output: {
			...jetpackWebpackConfig.output,
			path: path.join( __dirname, '../dist/contact-form' ),
		},
	},
];

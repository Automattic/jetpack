const path = require( 'path' );
const webpack = require( 'webpack' );

const CssMinimizerPlugin = require( 'css-minimizer-webpack-plugin' );
const TerserPlugin = require( './webpack/terser' );
const DependencyExtractionWebpackPlugin = require( '@wordpress/dependency-extraction-webpack-plugin' );
const DuplicatePackageCheckerWebpackPlugin = require( 'duplicate-package-checker-webpack-plugin' );
const MiniCssExtractPlugin = require( 'mini-css-extract-plugin' );
const MiniCSSWithRTLPlugin = require( './webpack/mini-css-with-rtl' );
const WebpackRTLPlugin = require( '@automattic/webpack-rtl-plugin' );

const MyCssMinimizerPlugin = options => new CssMinimizerPlugin( options );

// See README.md for explanations of all these settings.
// If you change something here, you'll probably need to update README.md to match.
const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = ! isProduction;
const mode = isProduction ? 'production' : 'development';
const devtool = isProduction ? false : 'eval-cheap-module-source-map';
const output = {
	filename: '[name].min.js',
	chunkFilename: '[name]-[id].H[contenthash:20].min.js',
};
const optimization = {
	minimize: isProduction,
	minimizer: [ TerserPlugin(), MyCssMinimizerPlugin() ],
	concatenateModules: false,
};
const resolve = {
	extensions: [ '.js', '.jsx', '.ts', '.tsx', '...' ],
};

/****** Plugins ******/

const DefinePlugin = defines => [
	new webpack.DefinePlugin( {
		'process.env.FORCE_REDUCED_MOTION': 'false',
		global: 'window',
		...defines,
	} ),
];

const MomentLocaleIgnorePlugin = () => [
	new webpack.IgnorePlugin( {
		resourceRegExp: /^\.\/locale$/,
		contextRegExp: /moment$/,
	} ),
];

const MyMiniCssExtractPlugin = options => [ new MiniCssExtractPlugin( options ) ];

const MyMiniCssWithRtlPlugin = options => [ new MiniCSSWithRTLPlugin( options ) ];

const MyWebpackRtlPlugin = options => [ new WebpackRTLPlugin( options ) ];

const DuplicatePackageCheckerPlugin = options => [
	new DuplicatePackageCheckerWebpackPlugin( options ),
];

const DependencyExtractionPlugin = options => [ new DependencyExtractionWebpackPlugin( options ) ];

const StandardPlugins = ( options = {} ) => {
	return [
		...( options.DefinePlugin === false ? [] : DefinePlugin( options.DefinePlugin ) ),
		...( options.MomentLocaleIgnorePlugin === false
			? []
			: MomentLocaleIgnorePlugin( options.MomentLocaleIgnorePlugin ) ),
		...( options.MiniCssExtractPlugin === false
			? []
			: MyMiniCssExtractPlugin( options.MiniCssExtractPlugin ) ),
		...( options.MiniCssWithRtlPlugin === false
			? []
			: MyMiniCssWithRtlPlugin( options.MiniCssWithRtlPlugin ) ),
		...( options.WebpackRtlPlugin === false ? [] : MyWebpackRtlPlugin( options.WebpackRtlPlugin ) ),
		...( options.DuplicatePackageCheckerPlugin === false
			? []
			: DuplicatePackageCheckerPlugin( options.DuplicatePackageCheckerPlugin ) ),
		...( options.DependencyExtractionPlugin === false
			? []
			: DependencyExtractionPlugin( options.DependencyExtractionPlugin ) ),
	];
};

/****** Module rules and loaders ******/

const TranspileRule = require( './webpack/transpile-rule' );
const FileRule = require( './webpack/file-rule' );
const MiniCssExtractLoader = options => ( {
	loader: MiniCssExtractPlugin.loader,
	options: options,
} );
const CssLoader = options => ( {
	loader: require.resolve( 'css-loader' ),
	options: {
		// By default we do not want css-loader to try to handle absolute paths.
		url: { filter: urlpath => ! urlpath.startsWith( '/' ) },
		...options,
	},
} );
const CssCacheLoader = options => ( {
	loader: require.resolve( 'cache-loader' ),
	options: {
		cacheDirectory: path.resolve( '.cache/css-loader' ),
		...options,
	},
} );

// Note: For this cjs module to be used with named exports in an mjs context, modules.exports
// needs to contain only simple variables like `a` or `a: b`. Define anything more complex
// as a variable above, then use the variable here.
// @see https://github.com/nodejs/node/blob/master/deps/cjs-module-lexer/README.md#exports-object-assignment
module.exports = {
	webpack,
	isProduction,
	isDevelopment,
	mode,
	devtool,
	output,
	optimization,
	TerserPlugin,
	CssMinimizerPlugin: MyCssMinimizerPlugin,
	resolve,
	// Plugins.
	StandardPlugins,
	DefinePlugin,
	MomentLocaleIgnorePlugin,
	MiniCssExtractPlugin: MyMiniCssExtractPlugin,
	MiniCssWithRtlPlugin: MyMiniCssWithRtlPlugin,
	WebpackRtlPlugin: MyWebpackRtlPlugin,
	DependencyExtractionPlugin,
	DuplicatePackageCheckerPlugin,
	// Module rules and loaders.
	TranspileRule,
	FileRule,
	MiniCssExtractLoader,
	CssLoader,
	CssCacheLoader,
};

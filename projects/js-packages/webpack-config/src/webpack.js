const fs = require( 'fs' );
const path = require( 'path' );
const I18nCheckWebpackPlugin = require( '@automattic/i18n-check-webpack-plugin' );
const I18nLoaderWebpackPlugin = require( '@automattic/i18n-loader-webpack-plugin' );
const WebpackRTLPlugin = require( '@automattic/webpack-rtl-plugin' );
const DependencyExtractionWebpackPlugin = require( '@wordpress/dependency-extraction-webpack-plugin' );
const CssMinimizerPlugin = require( 'css-minimizer-webpack-plugin' );
const DuplicatePackageCheckerWebpackPlugin = require( 'duplicate-package-checker-webpack-plugin' );
const MiniCssExtractPlugin = require( 'mini-css-extract-plugin' );
const webpack = require( 'webpack' );
const CssRule = require( './webpack/css-rule' );
const FileRule = require( './webpack/file-rule' );
const MiniCSSWithRTLPlugin = require( './webpack/mini-css-with-rtl' );
const PnpmDeterministicModuleIdsPlugin = require( './webpack/pnpm-deterministic-ids.js' );
const TerserPlugin = require( './webpack/terser' );
const TranspileRule = require( './webpack/transpile-rule' );

const MyCssMinimizerPlugin = options => new CssMinimizerPlugin( options );

// See README.md for explanations of all these settings.
// If you change something here, you'll probably need to update README.md to match.
const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = ! isProduction;
const mode = isProduction ? 'production' : 'development';
const devtool = isProduction ? false : 'eval-cheap-module-source-map';
const output = {
	filename: '[name].js',
	chunkFilename: '[name].js?minify=false&ver=[contenthash]',
};
const optimization = {
	minimize: isProduction,
	minimizer: [ TerserPlugin(), MyCssMinimizerPlugin() ],
	concatenateModules: false,
	moduleIds: isProduction ? false : 'named',
	emitOnErrors: true,
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

const MyMiniCssExtractPlugin = options => [
	new MiniCssExtractPlugin( {
		filename: '[name].css',
		chunkFilename: '[name].css?minify=false&ver=[contenthash]',
		...options,
	} ),
];

const MyMiniCssWithRtlPlugin = options => [ new MiniCSSWithRTLPlugin( options ) ];

const MyWebpackRtlPlugin = options => [ new WebpackRTLPlugin( options ) ];

const DuplicatePackageCheckerPlugin = options => [
	new DuplicatePackageCheckerWebpackPlugin( options ),
];

const DependencyExtractionPlugin = options => [ new DependencyExtractionWebpackPlugin( options ) ];

const I18nLoaderPlugin = options => [ new I18nLoaderWebpackPlugin( options ) ];

const i18nFilterFunction = file => {
	if ( ! /\.(?:jsx?|tsx?|cjs|mjs|svelte)$/.test( file ) ) {
		return false;
	}
	const i = file.lastIndexOf( '/node_modules/' ) + 14;
	return i < 14 || file.startsWith( '@automattic/', i );
};
const I18nCheckPlugin = options => {
	const opts = { filter: i18nFilterFunction, ...options };
	if ( typeof opts.expectDomain === 'undefined' ) {
		let dir = process.cwd(),
			olddir;
		do {
			const file = path.join( dir, 'composer.json' );
			if ( fs.existsSync( file ) ) {
				const cfg = JSON.parse( fs.readFileSync( file, { encoding: 'utf8' } ) );
				if ( cfg.extra ) {
					if ( cfg.extra.textdomain ) {
						opts.expectDomain = cfg.extra.textdomain;
					} else if ( cfg.extra[ 'wp-plugin-slug' ] ) {
						opts.expectDomain = cfg.extra[ 'wp-plugin-slug' ];
					} else if ( cfg.extra[ 'wp-theme-slug' ] ) {
						opts.expectDomain = cfg.extra[ 'wp-theme-slug' ];
					}
				}
				break;
			}

			olddir = dir;
			dir = path.dirname( dir );
		} while ( dir !== olddir );
	}
	return [ new I18nCheckWebpackPlugin( opts ) ];
};
I18nCheckPlugin.defaultFilter = i18nFilterFunction;

const MyPnpmDeterministicModuleIdsPlugin = options => [
	new PnpmDeterministicModuleIdsPlugin( options ),
];

const StandardPlugins = ( options = {} ) => {
	if ( typeof options.I18nCheckPlugin === 'undefined' && isDevelopment ) {
		options.I18nCheckPlugin = false;
	}
	if ( typeof options.PnpmDeterministicModuleIdsPlugin === 'undefined' && isDevelopment ) {
		options.PnpmDeterministicModuleIdsPlugin = false;
	}

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
		...( options.I18nLoaderPlugin === false ? [] : I18nLoaderPlugin( options.I18nLoaderPlugin ) ),
		...( options.I18nCheckPlugin === false ? [] : I18nCheckPlugin( options.I18nCheckPlugin ) ),
		...( options.PnpmDeterministicModuleIdsPlugin === false
			? []
			: MyPnpmDeterministicModuleIdsPlugin( options.PnpmDeterministicModuleIdsPlugin ) ),
	];
};

/****** Module rules ******/

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
	I18nLoaderPlugin,
	PnpmDeterministicModuleIdsPlugin: MyPnpmDeterministicModuleIdsPlugin,
	// Module rules and loaders.
	TranspileRule,
	CssRule,
	FileRule,
};

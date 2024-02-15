const fs = require( 'fs' );
const path = require( 'path' );
const I18nCheckWebpackPlugin = require( '@automattic/i18n-check-webpack-plugin' );
const I18nSafeMangleExportsWebpackPlugin = require( '@automattic/i18n-check-webpack-plugin/I18nSafeMangleExportsPlugin' );
const I18nLoaderWebpackPlugin = require( '@automattic/i18n-loader-webpack-plugin' );
const WebpackRTLWebpackPlugin = require( '@automattic/webpack-rtl-plugin' );
const DuplicatePackageCheckerWebpackPlugin = require( '@cerner/duplicate-package-checker-webpack-plugin' );
const DependencyExtractionWebpackPlugin = require( '@wordpress/dependency-extraction-webpack-plugin' );
const CssMinimizerWebpackPlugin = require( 'css-minimizer-webpack-plugin' );
const ForkTSCheckerWebpackPlugin = require( 'fork-ts-checker-webpack-plugin' );
const MiniCssExtractWebpackPlugin = require( 'mini-css-extract-plugin' );
const webpack = require( 'webpack' );
const CssRule = require( './webpack/css-rule' );
const FileRule = require( './webpack/file-rule' );
const MiniCSSWithRTLWebpackPlugin = require( './webpack/mini-css-with-rtl' );
const PnpmDeterministicModuleIdsWebpackPlugin = require( './webpack/pnpm-deterministic-ids.js' );
const TerserPlugin = require( './webpack/terser' );
const TranspileRule = require( './webpack/transpile-rule' );

const CssMinimizerPlugin = options => new CssMinimizerWebpackPlugin( options );

/****** Functions ******/

let loadTextDomainFromComposerJson = () => {
	let dir = process.cwd(),
		olddir,
		ret;
	do {
		const file = path.join( dir, 'composer.json' );
		if ( fs.existsSync( file ) ) {
			const cfg = JSON.parse( fs.readFileSync( file, { encoding: 'utf8' } ) );
			if ( cfg.extra ) {
				if ( cfg.extra.textdomain ) {
					ret = cfg.extra.textdomain;
				} else if ( cfg.extra[ 'wp-plugin-slug' ] ) {
					ret = cfg.extra[ 'wp-plugin-slug' ];
				} else if ( cfg.extra[ 'wp-theme-slug' ] ) {
					ret = cfg.extra[ 'wp-theme-slug' ];
				}
			}
			break;
		}

		olddir = dir;
		dir = path.dirname( dir );
	} while ( dir !== olddir );

	// thunk it
	loadTextDomainFromComposerJson = () => ret;

	return ret;
};

const i18nFilterFunction = file => {
	if ( ! /\.(?:jsx?|tsx?|cjs|mjs|svelte)$/.test( file ) ) {
		return false;
	}
	const i = file.lastIndexOf( '/node_modules/' ) + 14;
	return i < 14 || file.startsWith( '@automattic/', i );
};

/****** Options ******/

// See README.md for explanations of all these settings.
// If you change something here, you'll probably need to update README.md to match.
const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = ! isProduction;
const mode = isProduction ? 'production' : 'development';
const devtool = isProduction ? false : 'source-map';
const output = {
	filename: '[name].js',
	chunkFilename: '[name].js?minify=false&ver=[contenthash]',
};
const optimization = {
	minimize: isProduction,
	minimizer: [ TerserPlugin(), CssMinimizerPlugin() ],
	mangleExports: false,
	concatenateModules: false,
	moduleIds: isProduction ? false : 'named',
	emitOnErrors: true,
};
const resolve = {
	extensions: [ '.js', '.jsx', '.ts', '.tsx', '...' ],
	// TypeScript's tsc needs to refer to files like "foo.js" even if they're named "foo.ts". We have to make webpack work with that convention too.
	extensionAlias: {
		'.js': [ '.js', '.ts', '.tsx' ],
		'.cjs': [ '.cjs', '.cts' ],
		'.mjs': [ '.mjs', '.mts' ],
	},
	conditionNames: [
		...( process.env.npm_config_jetpack_webpack_config_resolve_conditions
			? process.env.npm_config_jetpack_webpack_config_resolve_conditions.split( ',' )
			: [] ),
		'...',
	],
};

/****** Plugins ******/

const DefinePlugin = defines => [
	new webpack.DefinePlugin( {
		'process.env.FORCE_REDUCED_MOTION': 'false',
		global: 'window',
		...defines,
	} ),
];

const DependencyExtractionPlugin = options => [ new DependencyExtractionWebpackPlugin( options ) ];

const DuplicatePackageCheckerPlugin = options => [
	new DuplicatePackageCheckerWebpackPlugin( options ),
];

const ForkTSCheckerPlugin = options => [
	new ForkTSCheckerWebpackPlugin( {
		typescript: {
			mode: 'write-dts',
			diagnosticOptions: {
				semantic: true,
				syntactic: true,
				...options?.typescript?.diagnosticOptions,
			},
			...options?.typescript,
		},
		...options,
	} ),
];

const I18nCheckPlugin = options => {
	const opts = { filter: i18nFilterFunction, ...options };
	if ( typeof opts.expectDomain === 'undefined' ) {
		opts.expectDomain = loadTextDomainFromComposerJson();
	}
	return [ new I18nCheckWebpackPlugin( opts ) ];
};
I18nCheckPlugin.defaultFilter = i18nFilterFunction;

const I18nLoaderPlugin = options => {
	const opts = { ...options };
	if ( typeof opts.textdomain === 'undefined' ) {
		opts.textdomain = loadTextDomainFromComposerJson();
	}
	return [ new I18nLoaderWebpackPlugin( opts ) ];
};

const I18nSafeMangleExportsPlugin = options => [
	new I18nSafeMangleExportsWebpackPlugin( options ),
];

const MiniCssExtractPlugin = options => [
	new MiniCssExtractWebpackPlugin( {
		filename: '[name].css',
		chunkFilename: '[name].css?minify=false&ver=[contenthash]',
		...options,
	} ),
];

const MiniCssWithRtlPlugin = options => [ new MiniCSSWithRTLWebpackPlugin( options ) ];

const MomentLocaleIgnorePlugin = () => [
	new webpack.IgnorePlugin( {
		resourceRegExp: /^\.\/locale$/,
		contextRegExp: /moment$/,
	} ),
];

const PnpmDeterministicModuleIdsPlugin = options => [
	new PnpmDeterministicModuleIdsWebpackPlugin( options ),
];

const WebpackRtlPlugin = options => [ new WebpackRTLWebpackPlugin( options ) ];

const StandardPlugins = ( options = {} ) => {
	if ( typeof options.ForkTSCheckerPlugin === 'undefined' ) {
		options.ForkTSCheckerPlugin = false;
	}
	if ( typeof options.I18nCheckPlugin === 'undefined' && isDevelopment ) {
		options.I18nCheckPlugin = false;
	}
	if ( typeof options.I18nSafeMangleExportsPlugin === 'undefined' && isDevelopment ) {
		options.I18nSafeMangleExportsPlugin = false;
	}
	if ( typeof options.PnpmDeterministicModuleIdsPlugin === 'undefined' && isDevelopment ) {
		options.PnpmDeterministicModuleIdsPlugin = false;
	}

	return [
		...( options.DefinePlugin === false ? [] : DefinePlugin( options.DefinePlugin ) ),
		...( options.DependencyExtractionPlugin === false
			? []
			: DependencyExtractionPlugin( options.DependencyExtractionPlugin ) ),
		...( options.DuplicatePackageCheckerPlugin === false
			? []
			: DuplicatePackageCheckerPlugin( options.DuplicatePackageCheckerPlugin ) ),
		...( options.ForkTSCheckerPlugin === false
			? []
			: ForkTSCheckerPlugin( options.ForkTSCheckerPlugin ) ),
		...( options.I18nCheckPlugin === false ? [] : I18nCheckPlugin( options.I18nCheckPlugin ) ),
		...( options.I18nLoaderPlugin === false ? [] : I18nLoaderPlugin( options.I18nLoaderPlugin ) ),
		...( options.I18nSafeMangleExportsPlugin === false
			? []
			: I18nSafeMangleExportsPlugin( options.I18nSafeMangleExportsPlugin ) ),
		...( options.MiniCssExtractPlugin === false
			? []
			: MiniCssExtractPlugin( options.MiniCssExtractPlugin ) ),
		...( options.MiniCssWithRtlPlugin === false
			? []
			: MiniCssWithRtlPlugin( options.MiniCssWithRtlPlugin ) ),
		...( options.MomentLocaleIgnorePlugin === false
			? []
			: MomentLocaleIgnorePlugin( options.MomentLocaleIgnorePlugin ) ),
		...( options.PnpmDeterministicModuleIdsPlugin === false
			? []
			: PnpmDeterministicModuleIdsPlugin( options.PnpmDeterministicModuleIdsPlugin ) ),
		...( options.WebpackRtlPlugin === false ? [] : WebpackRtlPlugin( options.WebpackRtlPlugin ) ),
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
	CssMinimizerPlugin,
	resolve,
	// Plugins.
	StandardPlugins,
	DefinePlugin,
	DependencyExtractionPlugin,
	DuplicatePackageCheckerPlugin,
	ForkTSCheckerPlugin,
	I18nCheckPlugin,
	I18nLoaderPlugin,
	I18nSafeMangleExportsPlugin,
	MiniCssExtractPlugin,
	MiniCssWithRtlPlugin,
	MomentLocaleIgnorePlugin,
	PnpmDeterministicModuleIdsPlugin,
	WebpackRtlPlugin,
	// Module rules and loaders.
	TranspileRule,
	CssRule,
	FileRule,
};

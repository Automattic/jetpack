const fs = require( 'fs' );
const path = require( 'path' );
const I18nCheckWebpackPlugin = require( '@automattic/i18n-check-webpack-plugin' );
const I18nSafeMangleExportsWebpackPlugin = require( '@automattic/i18n-check-webpack-plugin/I18nSafeMangleExportsPlugin' );
const I18nLoaderWebpackPlugin = require( '@automattic/i18n-loader-webpack-plugin' );
const WebpackRTLWebpackPlugin = require( '@automattic/webpack-rtl-plugin' );
const DuplicatePackageCheckerWebpackPlugin = require( '@cerner/duplicate-package-checker-webpack-plugin' );
const ReactRefreshWebpackPlugin = require( '@pmmmwh/react-refresh-webpack-plugin' );
const DependencyExtractionWebpackPlugin = require( '@wordpress/dependency-extraction-webpack-plugin' );
const CssMinimizerWebpackPlugin = require( 'css-minimizer-webpack-plugin' );
const ForkTSCheckerWebpackPlugin = require( 'fork-ts-checker-webpack-plugin' );
const MiniCssExtractWebpackPlugin = require( 'mini-css-extract-plugin' );
const webpack = require( 'webpack' );
const BundledWpPkgsTranspileRules = require( './webpack/bundled-wp-pkgs-transpile-rules' );
const CssRule = require( './webpack/css-rule' );
const DevServer = require( './webpack/dev-server' );
const FileRule = require( './webpack/file-rule' );
const loadTextDomainFromComposerJson = require( './webpack/load-textdomain-from-composer-json.js' );
const MiniCSSWithRTLWebpackPlugin = require( './webpack/mini-css-with-rtl' );
const PnpmDeterministicModuleIdsWebpackPlugin = require( './webpack/pnpm-deterministic-ids.js' );
const TerserPlugin = require( './webpack/terser' );
const TranspileRule = require( './webpack/transpile-rule' );

const CssMinimizerPlugin = options => new CssMinimizerWebpackPlugin( options );

/****** Functions ******/

const i18nFilterFunction = file => {
	if ( ! /\.(?:jsx?|tsx?|cjs|mjs|svelte)$/.test( file ) ) {
		return false;
	}
	const i = file.lastIndexOf( '/node_modules/' ) + 14;
	return i < 14 || file.startsWith( '@automattic/', i );
};

const getUniqueName = () => {
	let dir = process.cwd(),
		olddir;
	do {
		const file = path.join( dir, 'package.json' );
		if ( fs.existsSync( file ) ) {
			const cfg = JSON.parse( fs.readFileSync( file, { encoding: 'utf8' } ) );
			if ( cfg.name ) {
				return cfg.name;
			}
		}

		const file2 = path.join( dir, 'composer.json' );
		if ( fs.existsSync( file2 ) ) {
			const cfg = JSON.parse( fs.readFileSync( file2, { encoding: 'utf8' } ) );
			if ( cfg.name ) {
				// Prepend an '@' to make it look more like a JS package name.
				return '@' + cfg.name;
			}
			break;
		}

		olddir = dir;
		dir = path.dirname( dir );
	} while ( dir !== olddir );

	throw new Error( 'Cannot determine unique name' );
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
	uniqueName: getUniqueName(),
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
	conditionNames: [ 'jetpack:src', '...' ],
};
const watchOptions = {
	ignored: [ '**/node_modules', '**/dist', '**/vendor' ],
};

/**
 * Generate filesystem cache configuration.
 *
 * @param {string} configFile - Config file being processed, for proper invalidation.
 *                            Generally, you'll pass `__filename` or `import.meta.filename`.
 * @return {object|undefined} Cache configuration. Returns undefined in CI.
 */
const cache = configFile => {
	if ( process.env.CI ) {
		return undefined;
	}
	return {
		type: 'filesystem',
		cacheDirectory: path.resolve(
			process.cwd(),
			'.cache/webpack',
			// Split cache on config filename to avoid collisions with parallel builds (e.g. plugins/jetpack).
			path.basename( configFile, path.extname( configFile ) )
		),
		store: 'pack',
		buildDependencies: {
			config: [ configFile ],
		},
	};
};

/****** Plugins ******/

const DefinePlugin = defines => [
	new webpack.DefinePlugin( {
		'process.env.FORCE_REDUCED_MOTION': 'false',
		global: 'window',
		...defines,
	} ),
];

const defaultRequestMap = {
	'@automattic/jetpack-script-data': {
		external: 'JetpackScriptDataModule',
		handle: 'jetpack-script-data',
	},
	'@automattic/jetpack-connection': {
		external: 'JetpackConnection',
		handle: 'jetpack-connection',
	},
	// The shared data stores are externalized into a single bundle so they
	// register exactly once. The package exposes only its barrel entry, so a
	// single mapping covers every consumer.
	'@automattic/jetpack-shared-stores': {
		external: 'JetpackSharedStores',
		handle: 'jetpack-shared-stores',
	},
};

const DependencyExtractionPlugin = ( { requestMap, ...options } = {} ) => {
	const finalRequestMap = { ...defaultRequestMap, ...requestMap };

	const requestToExternal = request => {
		return finalRequestMap[ request ]?.external;
	};

	const requestToHandle = request => {
		return finalRequestMap[ request ]?.handle;
	};

	return [
		new DependencyExtractionWebpackPlugin( {
			requestToExternal,
			requestToHandle,
			...options,
		} ),
	];
};

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

	// Default text domain.
	if ( typeof opts.expectDomain === 'undefined' ) {
		opts.expectDomain = loadTextDomainFromComposerJson();
	}

	// Default Babel options for extractor.
	if ( typeof opts.extractorOptions?.babelOptions === 'undefined' ) {
		const babelOptions = { babelrc: false };
		const configFile = path.resolve( 'babel.config.js' );
		if ( fs.existsSync( configFile ) ) {
			babelOptions.configFile = configFile;
		} else {
			babelOptions.presets = [ require.resolve( './babel-preset.js' ) ];
		}

		opts.extractorOptions ??= {};
		opts.extractorOptions.babelOptions = babelOptions;
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
		...( options.ReactRefreshWebpackPlugin === false ||
		process.env.WEBPACK_SERVE !== 'true' ||
		isProduction
			? []
			: [ new ReactRefreshWebpackPlugin( options.ReactRefreshWebpackPlugin ) ] ),
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
	watchOptions,
	cache,
	DevServer,
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
	ReactRefreshWebpackPlugin,
	// Module rules and loaders.
	TranspileRule,
	BundledWpPkgsTranspileRules,
	CssRule,
	FileRule,
};

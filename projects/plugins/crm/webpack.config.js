const path = require( 'path' );
const jetpackWebpackConfig = require( '@automattic/jetpack-webpack-config/webpack' );
const RemoveAssetWebpackPlugin = require( '@automattic/remove-asset-webpack-plugin' );
const glob = require( 'glob' );

const sassPattern = '**/sass/**/*.scss';
const jsPattern = '**/js/**/*.js';
const welcomeZBSCSSPattern = '**/css/welcome-to-zbs/*.css';

const alwaysIgnoredFiles = [
	'**/js/**/*.min.js',
	'**/src/js/**',
	'**/sass/**/_*.scss',
	'**/node_modules/**',
	'**/vendor/**',
	'**/tests/**',
	'**/lib/**',
	'**/welcome-to-zbs/*.min.css',
];

/**
 * Returns an array the full list of our '.js' files in the form:
 * [ './full/path/file' => './full/path/file.js'].
 * This list is generated using the above defined jsPattern and alwaysIgnoredFiles.
 *
 * @returns {Array} The list of js files that must be minified.
 */
function getJsEntries() {
	const entries = {};
	glob.sync( jsPattern, { ignore: alwaysIgnoredFiles } ).forEach( file => {
		entries[ './' + file.substring( 0, file.length - '.js'.length ) ] = './' + file;
	} );

	return entries;
}

/**
 * Returns an array the full list of our '.scss' files in the form:
 * [ './full/path/file' => './full/path/file.scss'].
 * This list is generated using the above defined sassPattern and alwaysIgnoredFiles.
 *
 * @returns {Array} The list of scss files that must be compiled and minified.
 */
function getSassEntries() {
	const entries = {};
	glob.sync( sassPattern, { ignore: alwaysIgnoredFiles } ).forEach( file => {
		const newPath = file.replace( 'sass', 'css' );
		entries[ './' + newPath.substring( 0, newPath.length - '.scss'.length ) + '.min' ] =
			'./' + file;
	} );
	return entries;
}

/**
 * Returns an array the full list of our 'css' files from the 'welcome-to-zbs' directory in the form:
 * [ './full/path/file' => './full/path/file.css'].
 * This list is generated using the above defined welcomeZBSCSSPattern and alwaysIgnoredFiles.
 *
 * @returns {Array} The list of css files that must be minified.
 */
function getWelcomeZBSCSSEntries() {
	const entries = {};
	glob.sync( welcomeZBSCSSPattern, { ignore: alwaysIgnoredFiles } ).forEach( file => {
		entries[ './' + file.substring( 0, file.length - '.css'.length ) + '.min' ] = './' + file;
	} );
	return entries;
}

const crmWebpackConfig = {
	mode: jetpackWebpackConfig.mode,
	devtool: jetpackWebpackConfig.isDevelopment ? 'source-map' : false,
	output: {
		...jetpackWebpackConfig.output,
		path: path.resolve( __dirname, '.' ),
	},
	optimization: {
		...jetpackWebpackConfig.optimization,
	},
	resolve: {
		...jetpackWebpackConfig.resolve,
	},
	node: false,
	plugins: [
		...jetpackWebpackConfig.StandardPlugins( {
			DependencyExtractionPlugin: false,
		} ),
	],
	module: {
		strictExportPresence: true,
		rules: [
			// Transpile JavaScript.
			jetpackWebpackConfig.TranspileRule( {
				exclude: [ /node_modules\//, /vendor\//, /tests\//, /lib\//, /sass\//, /min.js/ ],
			} ),

			// Transpile @automattic/jetpack-* in node_modules too.
			jetpackWebpackConfig.TranspileRule( {
				includeNodeModules: [ '@automattic/jetpack-' ],
			} ),
		],
	},
	externals: {
		...jetpackWebpackConfig.externals,
		jetpackConfig: JSON.stringify( {
			consumer_slug: 'zero-bs-crm',
		} ),
		'@wordpress/i18n': 'global wpI18n',
		'@wordpress/jp-i18n-loader': 'global jpI18nLoader',
	},
};

module.exports = [
	{
		...crmWebpackConfig,
		entry: getJsEntries(),
		output: {
			...crmWebpackConfig.output,
			filename: '[name].min.js',
			library: {
				name: 'window',
				type: 'assign-properties',
			},
		},
		optimization: {
			...crmWebpackConfig.optimization,
			minimizer: [
				jetpackWebpackConfig.TerserPlugin( {
					terserOptions: {
						mangle: {
							keep_fnames: true,
							keep_classnames: true,
						},
					},
				} ),
			],
		},
	},
	{
		...crmWebpackConfig,
		entry: getSassEntries(),
		module: {
			...crmWebpackConfig.module,
			rules: [
				...crmWebpackConfig.module.rules,
				// Handle CSS.
				jetpackWebpackConfig.CssRule( {
					extensions: [ 'css', 'sass', 'scss' ],
					extraLoaders: [ 'sass-loader' ],
					CssLoader: {
						url: false,
					},
				} ),
			],
		},
		plugins: [
			...crmWebpackConfig.plugins,
			// Delete the dummy JS files Webpack would otherwise create.
			new RemoveAssetWebpackPlugin( {
				assets: /\.js(\.map)?$/,
			} ),
		],
	},
	{
		...crmWebpackConfig,
		entry: getWelcomeZBSCSSEntries(),
		output: {
			...crmWebpackConfig.output,
		},
		module: {
			...crmWebpackConfig.module,
			rules: [
				...crmWebpackConfig.module.rules,
				// Handle CSS.
				jetpackWebpackConfig.CssRule( {
					extensions: [ 'css' ],
					CssLoader: {
						url: false,
					},
				} ),
			],
		},
		plugins: [
			...crmWebpackConfig.plugins,
			// Delete the dummy JS files Webpack would otherwise create.
			new RemoveAssetWebpackPlugin( {
				assets: /\.js(\.map)?$/,
			} ),
		],
	},
	{
		entry: {
			'onboarding-wizard': './src/js/onboarding-wizard-index.jsx',
		},
		mode: jetpackWebpackConfig.mode,
		devtool: jetpackWebpackConfig.isDevelopment ? 'source-map' : false,
		output: {
			...jetpackWebpackConfig.output,
			path: path.resolve( './build' ),
		},
		optimization: {
			...jetpackWebpackConfig.optimization,
		},
		resolve: {
			...jetpackWebpackConfig.resolve,
		},
		node: false,
		plugins: [
			...jetpackWebpackConfig.StandardPlugins( {
				DependencyExtractionPlugin: { injectPolyfill: true },
			} ),
		],
		module: {
			strictExportPresence: true,
			rules: [
				// Transpile plugin JavaScript.
				jetpackWebpackConfig.TranspileRule( {
					exclude: /node_modules\//,
				} ),

				// Transpile @automattic/jetpack-* in node_modules too.
				jetpackWebpackConfig.TranspileRule( {
					includeNodeModules: [ '@automattic/jetpack-' ],
				} ),

				// Handle CSS.
				jetpackWebpackConfig.CssRule( {
					extensions: [ 'css', 'sass', 'scss' ],
					extraLoaders: [ 'sass-loader' ],
				} ),

				// Handle images.
				jetpackWebpackConfig.FileRule(),
			],
		},
		externals: {
			...jetpackWebpackConfig.externals,
			jetpackConfig: JSON.stringify( {
				consumer_slug: 'zero-bs-crm',
			} ),
			'@wordpress/i18n': 'global wpI18n',
			'@wordpress/jp-i18n-loader': 'global jpI18nLoader',
		},
	},
];

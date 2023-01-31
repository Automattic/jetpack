const path = require( 'path' );
const jetpackWebpackConfig = require( '@automattic/jetpack-webpack-config/webpack' );
const RemoveAssetWebpackPlugin = require( '@automattic/remove-asset-webpack-plugin' );
const glob = require( 'glob' );

const sassPattern = '**/sass/**/*.scss';
const jsPattern = '**/js/**/*.js';
const alwaysIgnoredFiles = [
	'**/js/**/*.min.js',
	'**/sass/**/_*.scss',
	'**/node_modules/**',
	'**/vendor/**',
	'**/tests/**',
	'**/lib/**',
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
		entries[ './' + newPath.substring( 0, newPath.length - '.scss'.length ) ] = './' + file;
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
		},
	},
	{
		...crmWebpackConfig,
		entry: getSassEntries(),
		output: {
			...crmWebpackConfig.output,
		},
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
];

const path = require( 'path' );
const jetpackWebpackConfig = require( '@automattic/jetpack-webpack-config/webpack' );
const RemoveAssetWebpackPlugin = require( '@automattic/remove-asset-webpack-plugin' );
const CopyPlugin = require( 'copy-webpack-plugin' );
const { glob } = require( 'glob' );
const doNotMinify = false;
const buildLibPath = path.resolve( __dirname, 'build/lib/' );

/**
 * Return an array with a list of our legacy '.js' files.
 *
 * Format: [ './full/path/file' => './full/path/file.js'].
 *
 * @return {Array} The list of js files that must be minified.
 */
function getLegacyJsEntries() {
	const patterns = [ 'js/**/*.js', 'modules/**/js/*.js' ];
	const ignorePatterns = [
		'**/js/**/*.min.js',
		// The js/lib directory contains directly "hosted" 3. party libraries.
		'**/lib/**',
	];

	const entries = {};
	glob.sync( `{${ patterns.join( ',' ) }}`, { ignore: ignorePatterns } ).forEach( file => {
		entries[ './' + file.substring( 0, file.length - '.js'.length ) ] = './' + file;
	} );

	return entries;
}

/**
 * Return an array with a list of our legacy '.scss' files.
 *
 * Format: [ './full/path/file' => './full/path/file.scss'].
 *
 * @param {boolean} minification - Whether or not the scss should be minified.
 *
 * @return {Array} The list of scss files that must be compiled and minified.
 */
function getLegacySassEntries( minification = true ) {
	const patterns = [ 'sass/**/*.scss', 'modules/**/sass/**/*.scss' ];
	const ignorePatterns = [
		'**/sass/**/_*.scss',
		/*
		 * All Welcome to ZBS styling is handled separately.
		 * @see getLegacyWelcomeZBSCSSEntries()
		 */
		'**/welcome-to-zbs/**',
	];

	const entries = {};
	glob.sync( `{${ patterns.join( ',' ) }}`, { ignore: ignorePatterns } ).forEach( file => {
		const newPath = file.replace( 'sass', 'css' );
		if ( minification ) {
			entries[ './' + newPath.substring( 0, newPath.length - '.scss'.length ) + '.min' ] =
				'./' + file;
		} else {
			entries[ './' + newPath.substring( 0, newPath.length - '.scss'.length ) ] = './' + file;
		}
	} );
	return entries;
}

/**
 * Return array with a list of our legacy 'welcome-to-zbs' 'css' file structure.
 *
 * Format: [ './full/path/file' => './full/path/file.css'].
 *
 * @return {Array} The list of css files that must be minified.
 */
function getLegacyWelcomeZBSCSSEntries() {
	const ignorePatterns = [ '**/welcome-to-zbs/*.min.css' ];

	const entries = {};
	glob.sync( 'css/welcome-to-zbs/*.css', { ignore: ignorePatterns } ).forEach( file => {
		entries[ './' + file.substring( 0, file.length - '.css'.length ) + '.min' ] = './' + file;
	} );
	return entries;
}

/**
 * Return object with React component view file mapping.
 *
 * We look for "view.{js,jsx,ts,tsx}" files in React component directories to determine
 * if we should build the component or not. This is useful for bootstrap/app components
 * that import other components.
 *
 * @return {object} An object with a build path and a corresponding file path.
 */
function getReactComponentViewMapping() {
	const entries = {};

	glob.sync( 'src/js/components/**/view.{js,jsx,ts,tsx}' ).forEach( file => {
		const pathDetails = path.parse( file );
		const directoryName = pathDetails.dir.substring( pathDetails.dir.lastIndexOf( '/' ) + 1 );
		entries[ `${ directoryName }/index` ] = './' + file;
	} );

	return entries;
}

const crmWebpackConfig = {
	mode: jetpackWebpackConfig.mode,
	devtool: jetpackWebpackConfig.devtool,
	output: {
		...jetpackWebpackConfig.output,
		path: path.resolve( __dirname, '.' ),
	},
	optimization: {
		...jetpackWebpackConfig.optimization,
		mangleExports: false,
	},
	resolve: {
		...jetpackWebpackConfig.resolve,
		alias: {
			...jetpackWebpackConfig.resolve.alias,
			crm: path.resolve( __dirname, 'src/js/' ),
		},
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
				exclude: [ /node_modules\//, /vendor\//, /tests\// ],
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
		entry: getLegacyJsEntries(),
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
			minimize: true,
			minimizer: [
				jetpackWebpackConfig.TerserPlugin( {
					terserOptions: {
						mangle: {
							keep_fnames: true,
							keep_classnames: true,
						},
					},
					extractComments: jetpackWebpackConfig.isProduction,
				} ),
			],
		},
	},
	{
		...crmWebpackConfig,
		entry: getLegacySassEntries(),
		module: {
			...crmWebpackConfig.module,
			rules: [
				...crmWebpackConfig.module.rules,
				// Handle CSS.
				jetpackWebpackConfig.CssRule( {
					extensions: [ 'css', 'sass', 'scss' ],
					extraLoaders: [ { loader: 'sass-loader', options: { api: 'modern-compiler' } } ],
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
		mode: 'production',
		entry: getLegacySassEntries( doNotMinify ),
		optimization: {
			...crmWebpackConfig.optimization,
			minimize: false,
		},
		module: {
			...crmWebpackConfig.module,
			rules: [
				...crmWebpackConfig.module.rules,
				// // Handle CSS.
				jetpackWebpackConfig.CssRule( {
					extensions: [ 'css', 'sass', 'scss' ],
					extraLoaders: [
						{
							loader: 'sass-loader',
							options: {
								api: 'modern-compiler',
								sassOptions: {
									style: 'expanded',
								},
							},
						},
					],
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
		entry: getLegacyWelcomeZBSCSSEntries(),
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
		...crmWebpackConfig,
		entry: getReactComponentViewMapping(),
		output: {
			...jetpackWebpackConfig.output,
			path: path.resolve( './build' ),
		},
		plugins: [ ...jetpackWebpackConfig.StandardPlugins() ],
		module: {
			...crmWebpackConfig.module,
			rules: [
				...crmWebpackConfig.module.rules,

				// Handle CSS.
				jetpackWebpackConfig.CssRule( {
					extensions: [ 'css', 'sass', 'scss' ],
					extraLoaders: [
						{
							loader: 'sass-loader',
							options: {
								api: 'modern-compiler',
								sassOptions: {
									style: 'expanded',
								},
							},
						},
					],
					CssLoader: {
						modules: ! jetpackWebpackConfig.isProduction
							? {
									localIdentName: '[name]__[local]--[hash:base64:5]',
							  }
							: {},
					},
				} ),

				// Handle images.
				jetpackWebpackConfig.FileRule(),
			],
		},
	},
	// Copy third-party libraries into build dir.
	{
		...crmWebpackConfig,
		entry: {},
		output: {
			...crmWebpackConfig.output,
			path: path.resolve( __dirname, '.' ),
		},
		plugins: [
			new CopyPlugin( {
				patterns: [
					// Used by jpcrm-notifyme-front.js for notifications
					{
						from: path.resolve( __dirname, 'node_modules/js-cookie/dist/js.cookie.min.js' ),
						to: `${ buildLibPath }/js-cookie/`,
					},
					// Used by jpcrm-notifyme-front.js for notifications
					{
						from: path.resolve( __dirname, 'node_modules/push.js/bin/push.min.js' ),
						to: `${ buildLibPath }/push.js/`,
					},
					// Used by ZeroBSCRM.OnboardMe.php for the onboarding tour
					{
						from: path.resolve( __dirname, 'node_modules/hopscotch/dist/js/hopscotch.min.js' ),
						to: `${ buildLibPath }/hopscotch/`,
					},
					// Used by ZeroBSCRM.OnboardMe.php for the onboarding tour
					{
						from: path.resolve( __dirname, 'node_modules/hopscotch/dist/css/hopscotch.min.css' ),
						to: `${ buildLibPath }/hopscotch/`,
					},
					// Used extensively for alerts
					{
						from: path.resolve( __dirname, 'node_modules/sweetalert2/dist/sweetalert2.min.js' ),
						to: `${ buildLibPath }/sweetalert2/`,
					},
					// Used extensively for alerts
					{
						from: path.resolve( __dirname, 'node_modules/sweetalert2/dist/sweetalert2.min.css' ),
						to: `${ buildLibPath }/sweetalert2/`,
					},
					// Used for dashboard charts
					{
						from: path.resolve( __dirname, 'node_modules/chart.js/dist/chart.min.js' ),
						to: `${ buildLibPath }/chart.js/`,
					},
					// Used in a variety of areas
					{
						from: path.resolve( __dirname, 'node_modules/moment/min/moment-with-locales.min.js' ),
						to: `${ buildLibPath }/moment/`,
					},
					// Used extensively for date range selection
					{
						from: path.resolve( __dirname, 'node_modules/daterangepicker/daterangepicker.js' ),
						to: `${ buildLibPath }/daterangepicker/`,
					},
					// Used for first-use dashboard modals
					{
						from: path.resolve( __dirname, 'node_modules/jquery-modal/jquery.modal.min.js' ),
						to: `${ buildLibPath }/jquery-modal/`,
					},
					// Used for first-use dashboard modals
					{
						from: path.resolve( __dirname, 'node_modules/jquery-modal/jquery.modal.min.css' ),
						to: `${ buildLibPath }/jquery-modal/`,
					},
					// Used extensively for autocompleting contacts/companies, etc.
					{
						from: path.resolve(
							__dirname,
							'node_modules/typeahead.js/dist/typeahead.bundle.min.js'
						),
						to: `${ buildLibPath }/typeahead.js/`,
					},
					// Used for welcome wizard
					{
						from: path.resolve( __dirname, 'node_modules/bootstrap/dist/js/bootstrap.min.js' ),
						to: `${ buildLibPath }/bootstrap/`,
					},
					// Used for welcome wizard
					{
						from: path.resolve( __dirname, 'node_modules/bootstrap/dist/css/bootstrap.min.css' ),
						to: `${ buildLibPath }/bootstrap/`,
					},
				],
			} ),
		],
	},
];

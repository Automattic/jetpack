const path = require( 'path' );
const jetpackWebpackConfig = require( '@automattic/jetpack-webpack-config/webpack' );
const pkgDir = require( 'pkg-dir' );

module.exports = [
	{
		entry: {
			index: './_inc/admin.jsx',
		},
		mode: jetpackWebpackConfig.mode,
		devtool: jetpackWebpackConfig.devtool,
		output: {
			...jetpackWebpackConfig.output,
			path: path.resolve( './build' ),
		},
		optimization: {
			...jetpackWebpackConfig.optimization,
		},
		resolve: {
			...jetpackWebpackConfig.resolve,
			alias: {
				...jetpackWebpackConfig.resolve.alias,
				'@automattic/calypso-config': '@automattic/calypso-config/src/client.js',
				/** Replace the classnames used by @automattic/newspack-blocks with clsx because we changed to use clsx */
				classnames: findPackage( 'clsx' ),
			},
			fallback: {
				...jetpackWebpackConfig.resolve.fallback,
				events: require.resolve( 'events/' ),
			},
		},
		node: false,
		plugins: [ ...jetpackWebpackConfig.StandardPlugins() ],
		module: {
			strictExportPresence: true,
			rules: [
				// Transpile JavaScript
				jetpackWebpackConfig.TranspileRule( {
					exclude: /node_modules\//,
				} ),

				// Transpile @automattic/* in node_modules too.
				jetpackWebpackConfig.TranspileRule( {
					includeNodeModules: [ '@automattic/' ],
				} ),

				// Add textdomains (but no other optimizations) for @wordpress/dataviews.
				jetpackWebpackConfig.TranspileRule( {
					includeNodeModules: [ '@wordpress/dataviews/' ],
					babelOpts: {
						configFile: false,
						plugins: [
							[
								require.resolve( '@automattic/babel-plugin-replace-textdomain' ),
								{ textdomain: 'jetpack-subscribers-dashboard' },
							],
						],
					},
				} ),

				// Add textdomains (but no other optimizations) for @wordpress/dataviews.
				jetpackWebpackConfig.TranspileRule( {
					includeNodeModules: [ '@wordpress/dataviews/build-wp/' ],
					babelOpts: {
						configFile: false,
						plugins: [
							[
								require.resolve( '@automattic/babel-plugin-replace-textdomain' ),
								{ textdomain: 'jetpack-subscribers-dashboard' },
							],
						],
					},
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
				consumer_slug: 'subscribers',
			} ),
		},
	},
];

/**
 * Given a package name, finds the absolute path for it.
 *
 * require.resolve() will resolve to the main file of the package, using Node's resolution algorithm to find
 * a `package.json` and looking at the field `main`. This function will return the folder that contains `package.json`
 * instead of trying to resolve the main file.
 *
 * Example: `@wordpress/data` may resolve to `/home/myUser/wp-calypso/node_modules/@wordpress/data`.
 *
 * Note this is not the same as looking for `__dirname+'/node_modules/'+pkgName`, as the package may be in a parent
 * `node_modules`
 * @param {string} pkgName - Name of the package to search for.
 * @return {string} - The absolute path of the package.
 */
function findPackage( pkgName ) {
	const fullPath = require.resolve( pkgName );
	const packagePath = pkgDir.sync( fullPath );
	return packagePath;
}

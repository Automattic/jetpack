const path = require( 'path' );
const jetpackWebpackConfig = require( '@automattic/jetpack-webpack-config/webpack' );
const ver = require( '@wordpress/dataviews/package.json' ).version;

const dependencyData = {
	external: [ 'JetpackWpDataViewsSnapshot', ver ],
	handle: `jetpack-wp-dataviews-snapshot-${ ver }`,
};

class WriteHandlePlugin {
	apply( compiler ) {
		compiler.hooks.thisCompilation.tap( 'WriteHandlePlugin', compilation => {
			compilation.hooks.processAssets.tap(
				{
					name: 'WriteHandlePlugin',
					stage: compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL,
				},
				assets => {
					const content = JSON.stringify( dependencyData );
					assets[ 'dependency-data.json' ] = {
						source: () => content,
						size: () => content.length,
					};
				}
			);
		} );
	}
}

/**
 * Indicate whether a package should be force-bundled, overriding dependency-extraction-webpack-plugin.
 *
 * This generally matches the logic in node_modules/@wordpress/dataviews/build.js,
 * except we don't "force" local paths to be bundled (they will be anyway).
 *
 * @param {string} request - Item being imported.
 * @return {boolean} Whether to force it to be bundled.
 */
function forceBundle( request ) {
	// Don't bundle WordPress signleton packages.
	if ( request.match( /^@wordpress\/(data|hooks|i18n|date)(\/|$)/ ) ) {
		return false;
	}

	// Don't bundle this either.
	if ( request === '@wordpress/jp-i18n-loader' ) {
		return false;
	}

	// Bundle WordPress packages.
	if ( request.match( /^@wordpress\// ) ) {
		return true;
	}

	// Let dependency-extraction-webpack-plugin do its default thing for everything else.
	return false;
}

module.exports = {
	mode: jetpackWebpackConfig.mode,
	devtool: jetpackWebpackConfig.devtool,
	performance: false,
	entry: {
		dataviews: {
			import: './src/wp-dataviews.js',
			library: {
				name: dependencyData.external,
				type: 'window',
			},
		},
	},
	output: {
		...jetpackWebpackConfig.output,
		path: path.resolve( './build' ),
	},
	optimization: {
		...jetpackWebpackConfig.optimization,
		minimizer: [
			// Disable the optimization that turns `cond ? __( "foo", "domain" ) : __( "bar", "domain" )` into `__( cond ? "foo" : "bar", "domain" )`.
			// It breaks the i18n and we can't fix the upstream code to avoid it in the normal ways.
			jetpackWebpackConfig.TerserPlugin( {
				terserOptions: {
					compress: {
						conditionals: false,
					},
				},
			} ),
			jetpackWebpackConfig.CssMinimizerPlugin(),
		],
	},
	resolve: {
		...jetpackWebpackConfig.resolve,
	},
	node: false,
	module: {
		strictExportPresence: true,
		rules: [
			// Transpile JavaScript, including node_modules.
			jetpackWebpackConfig.TranspileRule(),
		],
	},
	plugins: [
		...jetpackWebpackConfig.StandardPlugins( {
			MiniCssExtractPlugin: { filename: '[name].css' },
			DependencyExtractionPlugin: {
				requestToExternal: request => {
					return forceBundle( request ) ? null : undefined;
				},
				requestToHandle: request => {
					return forceBundle( request ) ? null : undefined;
				},
			},
		} ),
		new WriteHandlePlugin(),
	],
};

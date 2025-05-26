/**
 * Webpack configuration for building JavaScript/CSS modules.
 */
const fs = require( 'fs' );
const path = require( 'path' );
const jetpackWebpackConfig = require( '@automattic/jetpack-webpack-config/webpack' );
const DependencyExtractionWebpackPlugin = require( '@wordpress/dependency-extraction-webpack-plugin' );
const { glob } = require( 'glob' );

const moduleSrcDir = path.join( __dirname, '../src/modules' );

// Check if modules directory exists
if ( ! fs.existsSync( moduleSrcDir ) ) {
	console.warn( `Modules directory not found: ${ moduleSrcDir }` ); // eslint-disable-line no-console
	// Return empty config if no modules directory
	module.exports = {};
} else {
	// Find all JS files in the modules directory
	const moduleFiles = glob.sync( path.join( moduleSrcDir, '**/*.js' ) );

	// Create entry points
	const entry = moduleFiles.reduce( ( acc, filepath ) => {
		// Maintain the directory structure relative to src/modules
		const relativePath = path.relative( moduleSrcDir, filepath );
		const outputPath = path.join( path.dirname( relativePath ), path.parse( filepath ).name );
		acc[ outputPath ] = filepath;
		return acc;
	}, {} );

	if ( Object.keys( entry ).length === 0 ) {
		console.warn( 'No module files found to build.' ); // eslint-disable-line no-console
		module.exports = {};
	} else {
		const moduleWebpackConfig = {
			mode: jetpackWebpackConfig.mode,
			devtool: jetpackWebpackConfig.devtool,
			entry,
			output: {
				...jetpackWebpackConfig.output,
				path: path.join( __dirname, '../dist/modules' ),
				module: true,
				chunkFormat: 'module',
				environment: {
					module: true,
				},
				library: {
					type: 'module',
				},
			},
			experiments: {
				outputModule: true,
			},
			optimization: {
				...jetpackWebpackConfig.optimization,
			},
			resolve: {
				...jetpackWebpackConfig.resolve,
				modules: [ 'node_modules' ],
			},
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
									api: 'modern-compiler',
									sassOptions: {
										style: 'expanded',
									},
								},
							},
						],
					} ),

					// Handle assets
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
				new DependencyExtractionWebpackPlugin(),
			],
		};

		module.exports = moduleWebpackConfig;
	}
}

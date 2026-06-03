/**
 * Webpack configuration for building JavaScript/CSS modules.
 */
import fs from 'fs';
import path from 'path';
import jetpackWebpackConfig from '@automattic/jetpack-webpack-config/webpack';
import autoprefixer from 'autoprefixer';
import { glob } from 'glob';

const __dirname = import.meta.dirname;

const moduleSrcDir = path.join( __dirname, '../src/modules' );

let moduleWebpackConfig;

// Check if modules directory exists
if ( ! fs.existsSync( moduleSrcDir ) ) {
	console.warn( `Modules directory not found: ${ moduleSrcDir }` ); // eslint-disable-line no-console
	// Return empty config if no modules directory
	moduleWebpackConfig = {};
} else {
	// Find all JS and TS files in the modules directory
	const moduleFiles = glob.sync( path.join( moduleSrcDir, '**/*.{js,ts}' ) );

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
		moduleWebpackConfig = {};
	} else {
		moduleWebpackConfig = {
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
									postcssOptions: { plugins: [ autoprefixer ] },
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

					// Allow importing .svg files as raw HTML strings via `?raw` query.
					{
						test: /\.svg$/i,
						resourceQuery: /raw/,
						type: 'asset/source',
					},

					// Handle assets (exclude ?raw SVG imports).
					{
						test: /\.(eot|ttf|woff|png|svg)$/i,
						type: 'asset/resource',
						resourceQuery: { not: [ /raw/ ] },
						generator: {
							emit: false,
							filename: '[file]',
						},
					},
				],
			},
			plugins: [
				...jetpackWebpackConfig.StandardPlugins( {
					DependencyExtractionPlugin: true,
					I18nLoaderPlugin: false,
					I18nCheckPlugin: false,
				} ),
			],
			watchOptions: {
				...jetpackWebpackConfig.watchOptions,
			},
		};
	}
}

export default moduleWebpackConfig;

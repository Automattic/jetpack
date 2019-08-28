/**
 * External dependencies
 */
var log = require( 'fancy-log' );
var gulp = require( 'gulp' );
var gulpif = require( 'gulp-if' );
var minify = require( 'gulp-minify' );
var PluginError = require( 'plugin-error' );
var prepend = require( 'gulp-append-prepend' );
var rename = require( 'gulp-rename' );
var saveLicense = require( 'uglify-save-license' );
var sourcemaps = require( 'gulp-sourcemaps' );
var through = require( 'through2' );
// import webpack from 'webpack';

// function getWebpackConfig() {
// 	return require( './../webpack.config.js' );
// }

// export const watch = function() {
// 	const config = getWebpackConfig();

// 	return webpack( config ).watch(
// 		100,
// 		onBuild.bind( this, function( error ) {
// 			if ( error ) {
// 				log( error );
// 				return;
// 			}
// 		} )
// 	);
// };

// gulp.task( 'react:modules', function( done ) {
// 	const config = getWebpackConfig();
// 	return webpack( config ).run( onBuild.bind( this, done ) );
// } );

module.exports = {
	build_module_assets: function( done, err, stats ) {
		// Webpack doesn't populate err in case the build fails
		// @see https://github.com/webpack/webpack/issues/708
		const erroringStats = stats.stats.find(
			( { compilation } ) => compilation.errors && compilation.errors.length
		);

		if ( erroringStats && done ) {
			done( new PluginError( 'webpack', erroringStats.compilation.errors[ 0 ] ) );
			return; // Otherwise gulp complains about done called twice
		}

		log(
			'Building modules JS…',
			stats.toString( {
				colors: true,
				hash: true,
				version: false,
				timings: true,
				assets: true,
				chunks: true,
				chunkModules: false,
				modules: false,
				cached: false,
				reasons: false,
				source: false,
				errorDetails: true,
				children: false,
			} ),
			'\nModules JS finished at',
			Date.now()
		);

		const is_prod = 'production' === process.env.NODE_ENV;

		// This assumes that every Jetpack module package has a name like `jetpack-module-blah` and has an `assets/js` directory
		const supportedModulesSource = 'vendor/automattic/jetpack-module-*/assets/js/*.js';

		// Uglify other JS from _inc and supported modules
		const sources = [
			supportedModulesSource,
			'!vendor/automattic/jetpack-module-*/assets/js/test-*.js',
		];

		// Don't process minified JS in _inc or modules directories
		const sourceNegations = [ '!vendor/automattic/jetpack-module-*/assets/js/*.min.js' ];
		gulp
			.src( [ ...sources, ...sourceNegations ] )
			.pipe(
				through.obj( function( file, enc, cb ) {
					console.warn( file.path );
				} )
			)
			.pipe(
				prepend.prependText(
					'/* Do not modify this file directly. It is compiled from other files. */\n'
				)
			)
			.pipe( gulpif( ! is_prod, sourcemaps.init() ) )
			.pipe(
				minify( {
					output: {
						comments: saveLicense,
					},
					noSource: true,
					ext: { min: '.js' },
				} )
			)
			.pipe( rename( { suffix: '.min' } ) )
			.pipe( gulpif( ! is_prod, sourcemaps.write( 'maps' ) ) ) // Put the maps in _inc/build/maps so that we can easily .svnignore
			.pipe( gulp.dest( '_inc/build' ) )
			.on( 'end', function() {
				log( 'Your module JS is now uglified!' );
				// done();
			} );
	},
};

// export const build = gulp.series( 'react:modules' );

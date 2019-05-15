/**
 * External dependencies
 */
import banner from 'gulp-banner';
import log from 'fancy-log';
import gulp from 'gulp';
import gulpif from 'gulp-if';
import minify from 'gulp-minify';
import PluginError from 'plugin-error';
import rename from 'gulp-rename';
import saveLicense from 'uglify-save-license';
import sourcemaps from 'gulp-sourcemaps';
import webpack from 'webpack';

function getWebpackConfig() {
	return require( './../../webpack.config.js' );
}

export const watch = function() {
	const config = getWebpackConfig();

	return webpack( config ).watch(
		100,
		onBuild.bind( this, function( error ) {
			if ( error ) {
				log( error );
				return;
			}
		} )
	);
};

gulp.task( 'react:master', function( done ) {
	const config = getWebpackConfig();

	return webpack( config ).run( onBuild.bind( this, done ) );
} );

function onBuild( done, err, stats ) {
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
		'Building JS…',
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
		'\nJS finished at',
		Date.now()
	);

	if ( 'production' === process.env.NODE_ENV ) {
		log( 'Uglifying JS...' );
		gulp
			.src( '_inc/build/admin.js' )
			.pipe(
				minify( {
					noSource: true,
					ext: { min: '.js' },
				} )
			)
			.pipe( gulp.dest( '_inc/build' ) )
			.on( 'end', function() {
				log( 'Your JS is now uglified!' );
			} );
	}

	const is_prod = 'production' === process.env.NODE_ENV;

	const supportedModules = [
		'shortcodes',
		'widgets',
		'widget-visibility',
		'custom-css',
		'publicize',
		'custom-post-types',
		'sharedaddy',
		'contact-form',
		'photon',
		'carousel',
		'related-posts',
		'tiled-gallery',
		'likes',
		'minileven',
		'infinite-scroll',
		'masterbar',
		'videopress',
		'comment-likes',
		'lazy-images',
	];

	// Source any JS for whitelisted modules, which will minimize us shipping much
	// more JS that we haven't pointed to in PHP yet.
	// Example output: modules/(shortcodes|widgets)/**/*.js
	const supportedModulesSource = `modules/@(${ supportedModules.join( '|' ) })/**/*.js`;

	// Uglify other JS from _inc and supported modules
	const sources = [ '_inc/*.js', supportedModulesSource, '!modules/**/test-*.js' ];

	// Don't process minified JS in _inc or modules directories
	const sourceNegations = [ '!_inc/*.min.js', '!modules/**/*.min.js' ];
	gulp
		.src( [ ...sources, ...sourceNegations ] )
		.pipe( banner( '/* Do not modify this file directly. It is compiled from other files. */\n' ) )
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
			log( 'Your other JS is now uglified!' );
			done();
		} );
}

export const build = gulp.series( 'react:master' );

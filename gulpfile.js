var autoprefixer = require( 'gulp-autoprefixer' );
var banner = require( 'gulp-banner' );
var gulp = require( 'gulp' );
var gutil = require( 'gulp-util' );
var path = require( 'path' );
var rename = require( 'gulp-rename' );
var sass = require( 'gulp-sass' );
var sourcemaps = require( 'gulp-sourcemaps' );
var webpack = require( 'webpack' );

function onBuild( done ) {
	return function( err, stats ) {
		if ( err ) {
			throw new gutil.PluginError( 'webpack', err );
		}

		gutil.log( 'Building JS…', stats.toString( {
			colors: true
		} ), "\nJS finished at", Date.now() );

		if ( done ) {
			done();
		}
	};
}

function getWebpackConfig() {
	// clone and extend webpackConfig
	var config = Object.create( require( './webpack.config.js' ) );
	config.devtool = 'sourcemap';
	config.debug = true;

	return config;
}

function doSass() {
	if ( arguments.length ) {
		console.log( 'Sass file ' + arguments[0].path + ' changed.' );
	}
	console.log( 'Building CSS bundle...' );
	gulp.src( './_inc/client/scss/style.scss' )
		.pipe( sass( { outputStyle: 'compressed' } ).on( 'error', sass.logError ) )
		.pipe( banner( '/* Do not modify this file directly.  It is compiled SASS code. */\n' ) )
		.pipe( autoprefixer( { browsers: [ 'last 2 versions', 'ie >= 8' ] } ) )
		.pipe( rename( { suffix: '.min' } ) )
		.pipe( gulp.dest( './_inc/build' ) )
		.on( 'end', function() {
			console.log( 'CSS finished.' );
		} );
}

gulp.task( 'sass:build', function() {
	doSass();
} );

gulp.task( 'sass:watch', function() {
	doSass();
	gulp.watch( [ './**/*.scss' ], doSass );
} );

gulp.task( 'react:build', function( done ) {
	process.env.NODE_ENV = 'production';

	var config = getWebpackConfig();
	config.plugins = config.plugins.concat(
		new webpack.optimize.DedupePlugin(),
		new webpack.optimize.UglifyJsPlugin()
	);

	config.devtool = 'source-map';
	config.debug = false;

	webpack( config ).run( onBuild( done ) );
} );

gulp.task( 'react:watch', function() {
	process.env.NODE_ENV = "production";

	var config = getWebpackConfig();

	webpack( config ).watch( 100, onBuild() );
} );

gulp.task( 'default', ['react:build', 'sass:build'] );
gulp.task( 'watch',   ['react:watch', 'sass:watch'] );

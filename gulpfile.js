var gulp = require( 'gulp' );
var path = require( 'path' );
var gutil = require( 'gulp-util' );
var webpack = require( 'webpack' );
var sass = require( 'gulp-sass' );
var autoprefixer = require( 'gulp-autoprefixer' );
var sourcemaps = require( 'gulp-sourcemaps' );

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
	config.devtool = "sourcemap";
	config.debug = true;

	return config;
}

function doSass() {
	if ( arguments.length ) {
		console.log( 'Sass file ' + arguments[0].path + ' changed.' );
	}
	console.log( 'Building CSS bundle' );
	gulp.src( './css/scss/components.scss' )
		.pipe( sass().on( 'error', sass.logError ) )
		.pipe( autoprefixer() )
		.pipe( sourcemaps.write( '.' ) )
		.pipe( gulp.dest( './css' ) )
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

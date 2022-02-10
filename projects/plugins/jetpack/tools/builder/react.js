/**
 * External dependencies
 */
import log from 'fancy-log';
import gulp from 'gulp';
import PluginError from 'plugin-error';
import webpack from 'webpack';

function getWebpackConfig() {
	return require( './../webpack.config.js' );
}

export const watch = function () {
	const config = getWebpackConfig();

	return webpack( config ).watch(
		100,
		onBuild.bind( this, function ( error ) {
			if ( error ) {
				log( error );
				return;
			}
		} )
	);
};

gulp.task( 'react:master', function ( done ) {
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

	done();
}

export const build = gulp.series( 'react:master' );

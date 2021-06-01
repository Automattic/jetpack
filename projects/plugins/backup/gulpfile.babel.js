/**
 * External dependencies
 */
import gulp from 'gulp';
import log from 'fancy-log';
import webpack from 'webpack';

/**
 * Get the Webpack config.
 *
 * @returns {Array} - The Webpack config.
 */
function getWebpackConfig() {
	return require( './webpack.config.js' );
}

gulp.task( 'build', function ( done ) {
	return webpack( getWebpackConfig() ).run( done );
} );

gulp.task( 'watch', function () {
	return webpack( getWebpackConfig() ).watch( { aggregateTimeout: 100 }, error => {
		if ( error ) {
			log( error );
			return;
		}
	} );
} );

gulp.task( 'default', gulp.series( 'build' ) );

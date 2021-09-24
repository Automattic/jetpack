/**
 * External dependencies
 */
import gulp from 'gulp';
import webpack from 'webpack';
import log from 'fancy-log';
import gulpSass from 'gulp-sass';
import dartSass from 'sass';
import prepend from 'gulp-append-prepend';
import autoprefixer from 'gulp-autoprefixer';
import sourcemaps from 'gulp-sourcemaps';
import rename from 'gulp-rename';
import cleanCSS from 'gulp-clean-css';
import rtlcss from 'gulp-rtlcss';

const sass = gulpSass( dartSass );

/**
 * Get the Webpack config.
 *
 * @returns {Array} - The Webpack config.
 */
function getWebpackConfig() {
	return require( './webpack.config.js' );
}

gulp.task( 'scss', function () {
	return (
		gulp
			.src( './src/idc/scss/*.scss', { base: './src/idc/scss/' } )
			.pipe( sass( { outputStyle: 'expanded' } ) )
			.pipe(
				prepend.prependText(
					'/*!\n' + '* Do not modify this file directly.  It is compiled SASS code.\n' + '*/\n'
				)
			)
			.pipe( autoprefixer() )
			// Build *.css
			.pipe( sourcemaps.init() )
			.pipe( sourcemaps.write() )
			.pipe( gulp.dest( './build/css' ) )
			// Build *.min.css
			.pipe( cleanCSS() )
			.pipe( rename( { suffix: '.min' } ) )
			.pipe( gulp.dest( './build/css' ) )
			// Finished
			.on( 'end', function () {
				log( 'SCSS now compiled' );
			} )
	);
} );

gulp.task(
	'scss:rtl',
	gulp.series( 'scss', function () {
		return (
			gulp
				.src( './src/idc/scss/*.scss', { base: './src/idc/scss/' } )
				.pipe( sass( { outputStyle: 'expanded' } ) )
				.pipe(
					prepend.prependText(
						'/*!\n' +
							'* Do not modify this file directly.  It is automatically generated.\n' +
							'*/\n'
					)
				)
				.pipe( autoprefixer() )
				// Build *-rtl.css
				.pipe( rtlcss() )
				.pipe( rename( { suffix: '-rtl' } ) )
				.pipe( gulp.dest( './build/css' ) )
				// Build *-rtl.min.css
				.pipe( cleanCSS() )
				.pipe( rename( { suffix: '.min' } ) )
				.pipe( gulp.dest( './build/css' ) )
				// Finished
				.on( 'end', function () {
					log( 'SCSS now available in RTL.' );
				} )
		);
	} )
);

gulp.task( 'scss:watch', function () {
	return gulp.watch( './src/idc/scss/**/*.scss', gulp.parallel( 'scss:rtl' ) );
} );

gulp.task(
	'build',
	gulp.series( 'scss:rtl', done => webpack( getWebpackConfig() ).run( done ) )
); //function ( done ) {
//webpack( getWebpackConfig() ).run( done );
/*gulp.series( 'scss:rtl' );
	done();
} );*/

gulp.task( 'watch', function () {
	gulp.parallel( () => {
		return webpack( getWebpackConfig() ).watch( { aggregateTimeout: 100 }, error => {
			if ( error ) {
				log( error );
			}
		} );
	}, 'scss:watch' );
} );

gulp.task( 'default', gulp.series( 'build' ) );

/**
 * External dependencies
 */
import autoprefixer from 'gulp-autoprefixer';
import banner from 'gulp-banner';
import cleanCSS from 'gulp-clean-css';
import gulp from 'gulp';
import log from 'fancy-log';
import rename from 'gulp-rename';
import rtlcss from 'gulp-rtlcss';
import sass from 'gulp-sass';
import sourcemaps from 'gulp-sourcemaps';

/**
 * Internal dependencies
 */
import { alwaysIgnoredPaths } from './util';

gulp.task( 'sass:dashboard', function( done ) {
	log( 'Building Dashboard CSS bundle...' );

	return gulp.src( './_inc/client/scss/style.scss' )
		.pipe( sass( { outputStyle: 'compressed' } ).on( 'error', sass.logError ) )
		.pipe( banner( '/* Do not modify this file directly.  It is compiled SASS code. */\n' ) )
		.pipe( autoprefixer( { browsers: [ 'last 2 versions', 'ie >= 8' ] } ) )
		.pipe( rename( { suffix: '.min' } ) )
		.pipe( gulp.dest( './_inc/build' ) )
		.on( 'end', function() {
			log( 'Dashboard CSS finished.' );
			doRTL( 'main', done );
		} );
} );

gulp.task( 'sass:dops', function( done ) {
	log( 'Building dops-components CSS bundle...' );

	return gulp.src( './_inc/build/*dops-style.css' )
		.pipe( autoprefixer( 'last 2 versions', 'ie >= 8' ) )
		.pipe( gulp.dest( './_inc/build' ) )
		.on( 'end', function() {
			log( 'dops-components CSS finished.' );
			doRTL( 'dops', done );
		} );
} );

function doRTL( files, done ) {
	gulp.src( 'main' === files ? './_inc/build/style.min.css' : './_inc/build/*dops-style.css' )
		.pipe( rtlcss() )
		.pipe( rename( { suffix: '.rtl' } ) )
		.pipe( sourcemaps.init() )
		.pipe( sourcemaps.write( './' ) )
		.pipe( gulp.dest( './_inc/build' ) )
		.on( 'end', function() {
			log( 'main' === files ? 'Dashboard RTL CSS finished.' : 'DOPS Components RTL CSS finished.' );
			done();
		} );
}

gulp.task( 'sass:old:rtl', function() {
	return gulp.src( 'scss/*.scss' )
		.pipe( sass( { outputStyle: 'expanded' } ).on( 'error', sass.logError ) )
		.pipe( banner( '/*!\n' +
			'* Do not modify this file directly.  It is compiled SASS code.\n' +
			'*/\n'
		) )
		.pipe( autoprefixer() )
		// Build *-rtl.css & sourcemaps
		.pipe( rtlcss() )
		.pipe( rename( { suffix: '-rtl' } ) )
		.pipe( sourcemaps.init() )
		.pipe( sourcemaps.write( './' ) )
		.pipe( rename( { dirname: 'css' } ) )
		.pipe( gulp.dest( './' ) )
		// Build *-rtl.min.css
		.pipe( cleanCSS( { compatibility: 'ie8' } ) )
		.pipe( rename( { suffix: '.min' } ) )
		.pipe( gulp.dest( './' ) )
		// Finished
		.on( 'end', function() {
			log( 'Global admin RTL CSS finished.' );
		} );
} );

gulp.task( 'sass:old', gulp.series( 'sass:old:rtl', function() {
	return gulp.src( 'scss/**/*.scss' )
		.pipe( sass( { outputStyle: 'expanded' } ).on( 'error', sass.logError ) )
		.pipe( banner( '/*!\n' +
			'* Do not modify this file directly.  It is compiled SASS code.\n' +
			'*/\n'
		) )
		.pipe( autoprefixer() )
		// Build *.css & sourcemaps
		.pipe( sourcemaps.init() )
		.pipe( sourcemaps.write( './' ) )
		.pipe( rename( { dirname: 'css' } ) )
		.pipe( gulp.dest( './' ) )
		// Build *.min.css & sourcemaps
		.pipe( cleanCSS( { compatibility: 'ie8' } ) )
		.pipe( rename( { suffix: '.min' } ) )
		.pipe( gulp.dest( './' ) )
		.pipe( sourcemaps.write( '.' ) )
		.on( 'end', function() {
			log( 'Global admin CSS finished.' );
		} );
} ) );

export const build = gulp.parallel(
	gulp.series( 'sass:dashboard', 'sass:dops' ),
	'sass:old'
);

export const watch = function() {
	return gulp.watch( [ './**/*.scss', ...alwaysIgnoredPaths ], gulp.parallel( 'sass:dashboard', 'sass:dops', 'sass:old' ) );
};

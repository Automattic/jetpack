/**
 * External dependencies
 */
import autoprefixer from 'gulp-autoprefixer';
import cleanCSS from 'gulp-clean-css';
import gulp from 'gulp';
import log from 'fancy-log';
import prepend from 'gulp-append-prepend';
import rename from 'gulp-rename';
import rtlcss from 'gulp-rtlcss';
import sass from 'gulp-sass';
import sourcemaps from 'gulp-sourcemaps';

/**
 * Internal dependencies
 */
import { alwaysIgnoredPaths } from './util';

gulp.task( 'sass:dashboard', function ( done ) {
	log( 'Building Dashboard CSS bundle...' );

	return gulp
		.src( './_inc/client/scss/style.scss' )
		.pipe( sass( { outputStyle: 'compressed' } ) )
		.pipe(
			prepend.prependText( '/* Do not modify this file directly.  It is compiled SASS code. */\n' )
		)
		.pipe( autoprefixer() )
		.pipe( rename( { suffix: '.min' } ) )
		.pipe( gulp.dest( './_inc/build' ) )
		.on( 'end', function () {
			log( 'Dashboard CSS finished.' );
			doRTL( 'main', done );
		} );
} );

gulp.task( 'sass:calypsoify', function ( done ) {
	log( 'Building Calypsoify CSS bundle...' );

	return gulp
		.src( './modules/calypsoify/*.scss' )
		.pipe( sass( { outputStyle: 'compressed' } ) )
		.pipe(
			prepend.prependText( '/* Do not modify this file directly.  It is compiled SASS code. */\n' )
		)
		.pipe( autoprefixer() )
		.pipe( rename( { suffix: '.min' } ) )
		.pipe( gulp.dest( './modules/calypsoify' ) )
		.on( 'end', function () {
			log( 'Calypsoify CSS finished.' );
			doRTL( 'calypsoify', done );
		} );
} );

gulp.task( 'sass:colorschemes', function ( done ) {
	log( 'Building Color schemes CSS...' );

	return gulp
		.src( './modules/masterbar/admin-color-schemes/colors/**/*.scss' )
		.pipe( sass( { outputStyle: 'compressed' } ) )
		.pipe(
			prepend.prependText( '/* Do not modify this file directly.  It is compiled SASS code. */\n' )
		)
		.pipe( autoprefixer() )
		.pipe( gulp.dest( './modules/masterbar/admin-color-schemes/colors' ) )
		.on( 'end', function () {
			log( 'Color Schemes CSS finished.' );
			doRTL( 'colorschemes', done );
		} );
} );

// eslint-disable-next-line jsdoc/require-jsdoc
function doRTL( files, done ) {
	let dest = './_inc/build',
		renameArgs = { suffix: '.rtl' },
		path,
		success;

	switch ( files ) {
		case 'main':
			path = './_inc/build/style.min.css';
			success = 'Dashboard RTL CSS finished.';
			break;
		case 'calypsoify':
			path = [ './modules/calypsoify/style*.min.css', '!./modules/calypsoify/style*rtl.min.css' ];
			dest = './modules/calypsoify';
			success = 'Calypsoify RTL CSS finished.';
			renameArgs = function ( pathx ) {
				pathx.basename = pathx.basename.replace( '.min', '' );
				pathx.extname = '-rtl.min.css';
			};
			break;
		case 'colorschemes':
			path = './modules/masterbar/admin-color-schemes/colors/**/colors.css';
			dest = './modules/masterbar/admin-color-schemes/colors';
			success = 'Color Schemes RTL CSS finished.';
			renameArgs = function ( pathx ) {
				pathx.extname = '-rtl.css';
			};
			break;
		default:
			// unknown value, fail out
			return;
	}

	gulp
		.src( path )
		.pipe( rtlcss() )
		.pipe( rename( renameArgs ) )
		.pipe( sourcemaps.init() )
		.pipe( sourcemaps.write( './' ) )
		.pipe( gulp.dest( dest ) )
		.on( 'end', function () {
			log( success );
			done();
		} );
}

gulp.task( 'sass:old:rtl', function () {
	return (
		gulp
			.src( 'scss/*.scss' )
			.pipe( sass( { outputStyle: 'expanded' } ) )
			.pipe(
				prepend.prependText(
					'/*!\n' + '* Do not modify this file directly.  It is compiled SASS code.\n' + '*/\n'
				)
			)
			.pipe( autoprefixer() )
			// Build *-rtl.css & sourcemaps
			.pipe( rtlcss() )
			.pipe( rename( { suffix: '-rtl' } ) )
			.pipe( sourcemaps.init() )
			.pipe( sourcemaps.write( './' ) )
			.pipe( rename( { dirname: 'css' } ) )
			.pipe( gulp.dest( './' ) )
			// Build *-rtl.min.css
			.pipe( cleanCSS() )
			.pipe( rename( { suffix: '.min' } ) )
			.pipe( gulp.dest( './' ) )
			// Finished
			.on( 'end', function () {
				log( 'Global admin RTL CSS finished.' );
			} )
	);
} );

gulp.task(
	'sass:old',
	gulp.series( 'sass:old:rtl', function () {
		return (
			gulp
				.src( 'scss/**/*.scss' )
				.pipe( sass( { outputStyle: 'expanded' } ) )
				.pipe(
					prepend.prependText(
						'/*!\n' + '* Do not modify this file directly.  It is compiled SASS code.\n' + '*/\n'
					)
				)
				.pipe( autoprefixer() )
				// Build *.css & sourcemaps
				.pipe( sourcemaps.init() )
				.pipe( sourcemaps.write( './' ) )
				.pipe( rename( { dirname: 'css' } ) )
				.pipe( gulp.dest( './' ) )
				// Build *.min.css & sourcemaps
				.pipe( cleanCSS() )
				.pipe( rename( { suffix: '.min' } ) )
				.pipe( gulp.dest( './' ) )
				.pipe( sourcemaps.write( '.' ) )
				.on( 'end', function () {
					log( 'Global admin CSS finished.' );
				} )
		);
	} )
);

gulp.task( 'sass:packages', function () {
	return (
		gulp
			.src( 'packages/**/assets/*.scss', { base: '.' } )
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
			.pipe( gulp.dest( '.' ) )
			// Build *.min.css
			.pipe( cleanCSS() )
			.pipe( rename( { suffix: '.min' } ) )
			.pipe( gulp.dest( '.' ) )
			// Finished
			.on( 'end', function () {
				log( 'Packages SCSS now compiled' );
			} )
	);
} );

gulp.task(
	'sass:packages:rtl',
	gulp.series( 'sass:packages', function () {
		return (
			gulp
				.src(
					[
						'packages/**/assets/*.css',
						'!packages/**/assets/*min.css',
						'!packages/**/assets/*rtl.css',
					],
					{ base: '.' }
				)
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
				.pipe( gulp.dest( '.' ) )
				// Build *-rtl.min.css
				.pipe( cleanCSS() )
				.pipe( rename( { suffix: '.min' } ) )
				.pipe( gulp.dest( '.' ) )
				// Finished
				.on( 'end', function () {
					log( 'Packages CSS are now available in RTL.' );
				} )
		);
	} )
);

export const build = gulp.parallel(
	gulp.series( 'sass:dashboard', 'sass:calypsoify' ),
	'sass:colorschemes',
	'sass:old',
	'sass:packages'
);

export const watch = function () {
	return gulp.watch(
		[ './**/*.scss', ...alwaysIgnoredPaths ],
		gulp.series( 'sass:dashboard', 'sass:calypsoify', 'sass:colorschemes', 'sass:old' )
	);
};

export const watchPackages = function () {
	return gulp.watch(
		[ './packages/jitm/assets/*.scss', ...alwaysIgnoredPaths ],
		gulp.parallel( 'sass:packages:rtl' )
	);
};

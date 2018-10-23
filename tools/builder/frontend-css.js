/**
 * External dependencies
 */
import autoprefixer from 'gulp-autoprefixer';
import banner from 'gulp-banner';
import cleanCSS from 'gulp-clean-css';
import concat from 'gulp-concat';
import gulp from 'gulp';
import modify from 'gulp-modify';
import path from 'path';
import rename from 'gulp-rename';
import rtlcss from 'gulp-rtlcss';
import util from 'gulp-util';

/**
 * Internal dependencies
 */
import { transformRelativePath } from './transform-relative-paths';

/**
 * Front-end CSS to be concatenated.
 *
 * When making changes to that list, you must also update $concatenated_style_handles in class.jetpack.php.
 */
const concat_list = [
	'modules/carousel/jetpack-carousel.css',
	'modules/contact-form/css/grunion.css',
	'modules/infinite-scroll/infinity.css',
	'modules/likes/style.css',
	'modules/related-posts/related-posts.css',
	'modules/sharedaddy/sharing.css',
	'modules/shortcodes/css/slideshow-shortcode.css',
	'modules/shortcodes/css/style.css', // TODO: Should be renamed to shortcode-presentations
	'modules/shortcodes/css/quiz.css',
	'modules/subscriptions/subscriptions.css',
	'modules/theme-tools/responsive-videos/responsive-videos.css',
	'modules/theme-tools/social-menu/social-menu.css',
	'modules/tiled-gallery/tiled-gallery/tiled-gallery.css',
	'modules/widgets/wordpress-post-widget/style.css',
	'modules/widgets/gravatar-profile.css',
	'modules/widgets/goodreads/css/goodreads.css',
	'modules/widgets/social-media-icons/style.css',
	'modules/widgets/top-posts/style.css',
	'modules/widgets/image-widget/style.css',
	'modules/widgets/my-community/style.css',
	'modules/widgets/authors/style.css',
	'modules/wordads/css/style.css',
	'modules/widgets/eu-cookie-law/style.css',
	'modules/widgets/flickr/style.css',
	'modules/widgets/search/css/search-widget-frontend.css',
	'modules/widgets/simple-payments/style.css',
	'modules/widgets/social-icons/social-icons.css',
];

/**
 * Front end CSS that needs separate minified and RTL styles.
 * This list will need to have files added as we move to the add_style RTL approach.
 */
const separate_list = [
	'modules/carousel/jetpack-carousel.css',
	'modules/contact-form/css/grunion.css',
	'modules/related-posts/related-posts.css',
	'modules/shortcodes/css/recipes.css',
	'modules/shortcodes/css/recipes-print.css',
	'modules/tiled-gallery/tiled-gallery/tiled-gallery.css',
];

const pathModifier = function( file, contents ) {
	const regex = /url\((.*)\)/g,
		f = file.path.replace( file.cwd + '/', '' );
	return contents.replace( regex, function( match, group ) {
		return 'url(\'' + transformRelativePath( group, f ) + '\')';
	} );
};

// Frontend CSS.  Auto-prefix and minimize.
gulp.task( 'frontendcss', function() {
	return gulp.src( concat_list )
		.pipe( modify( { fileModifier: pathModifier } ) )
		.pipe( autoprefixer(
			'last 2 versions',
			'safari 5',
			'ie 8',
			'ie 9',
			'Firefox 14',
			'opera 12.1',
			'ios 6',
			'android 4'
		) )
		.pipe( cleanCSS( { compatibility: 'ie8' } ) )
		.pipe( concat( 'jetpack.css' ) )
		.pipe( banner( '/*!\n' +
			'* Do not modify this file directly.  It is concatenated from individual module CSS files.\n' +
			'*/\n'
		) )
		.pipe( gulp.dest( 'css' ) )
		.pipe( rtlcss() )
		.pipe( rename( { suffix: '-rtl' } ) )
		.pipe( gulp.dest( 'css/' ) )
		.on( 'end', function() {
			util.log( 'Front end modules CSS finished.' );
		} );
} );

gulp.task( 'frontendcss:separate', function() {
	return gulp.src( separate_list )
		.pipe( modify( { fileModifier: pathModifier } ) )
		.pipe( autoprefixer(
			'last 2 versions',
			'safari 5',
			'ie 8',
			'ie 9',
			'Firefox 14',
			'opera 12.1',
			'ios 6',
			'android 4'
		) )
		.pipe( cleanCSS( { compatibility: 'ie8' } ) )
		.pipe( rtlcss() )
		.pipe( rename( { suffix: '-rtl' } ) )
		.pipe( gulp.dest( function( file ) {
			return path.dirname( file.path );
		} ) );
} );

export default gulp.parallel(
	'frontendcss',
	'frontendcss:separate'
);


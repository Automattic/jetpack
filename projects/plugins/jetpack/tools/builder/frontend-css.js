/**
 * External dependencies
 */
import autoprefixer from 'gulp-autoprefixer';
import cleanCSS from 'gulp-clean-css';
import concat from 'gulp-concat';
import gulp from 'gulp';
import modifyCssUrls from 'gulp-modify-css-urls';
import path from 'path';
import prepend from 'gulp-append-prepend';
import rename from 'gulp-rename';
import rtlcss from 'gulp-rtlcss';
import log from 'fancy-log';

/**
 * Internal dependencies
 */
import { transformRelativePath } from './transform-relative-paths';

/**
 * Front-end CSS to be concatenated.
 *
 * When making changes to that list, you must also update $concatenated_style_handles in class.jetpack.php.
 */
export const frontendCSSSeparateFilesList = [
	'modules/carousel/swiper-bundle.css',
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
	'modules/widgets/instagram/instagram.css',
	'modules/widgets/search/css/search-widget-frontend.css',
	'modules/widgets/simple-payments/style.css',
	'modules/widgets/social-icons/social-icons.css',
];

/**
 * Front end CSS that needs separate minified and RTL styles.
 * This list will need to have files added as we move to the add_style RTL approach.
 */
export const frontendCSSConcatFilesList = [
	'modules/carousel/jetpack-carousel.css',
	'modules/contact-form/css/grunion.css',
	'modules/related-posts/related-posts.css',
	'modules/shortcodes/css/recipes.css',
	'modules/shortcodes/css/recipes-print.css',
	'modules/tiled-gallery/tiled-gallery/tiled-gallery.css',
	'modules/theme-tools/compat/twentynineteen.css',
	'modules/theme-tools/compat/twentytwenty.css',
	'modules/theme-tools/compat/twentytwentyone.css',
];

const cwd = process.cwd() + '/';

const pathModifier = function ( url, filePath ) {
	const f = filePath.replace( cwd, '' );
	return transformRelativePath( url, f );
};

// Frontend CSS.  Auto-prefix and minimize.
gulp.task( 'frontendcss', function () {
	return gulp
		.src( frontendCSSSeparateFilesList )
		.pipe( modifyCssUrls( { modify: pathModifier } ) )
		.pipe( autoprefixer() )
		.pipe( cleanCSS() )
		.pipe( concat( 'jetpack.css' ) )
		.pipe(
			prepend.prependText(
				'/*!\n' +
					'* Do not modify this file directly.  It is concatenated from individual module CSS files.\n' +
					'*/\n'
			)
		)
		.pipe( gulp.dest( 'css' ) )
		.pipe( rtlcss() )
		.pipe( rename( { suffix: '-rtl' } ) )
		.pipe( gulp.dest( 'css/' ) )
		.on( 'end', function () {
			log( 'Front end modules CSS finished.' );
		} );
} );

gulp.task( 'frontendcss:separate', function () {
	return gulp
		.src( frontendCSSConcatFilesList )
		.pipe( modifyCssUrls( { modify: pathModifier } ) )
		.pipe( autoprefixer() )
		.pipe( cleanCSS() )
		.pipe( rtlcss() )
		.pipe( rename( { suffix: '-rtl' } ) )
		.pipe(
			gulp.dest( function ( file ) {
				return path.dirname( file.path );
			} )
		);
} );

export default gulp.parallel( 'frontendcss', 'frontendcss:separate' );

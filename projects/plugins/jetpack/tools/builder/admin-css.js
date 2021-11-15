// Admin CSS to be minified, autoprefixed, rtl

/**
 * External dependencies
 */
import autoprefixer from 'gulp-autoprefixer';
import cleanCSS from 'gulp-clean-css';
import gulp from 'gulp';
import prepend from 'gulp-append-prepend';
import rename from 'gulp-rename';
import rtlcss from 'gulp-rtlcss';
import log from 'fancy-log';

export const adminCSSFiles = [
	// Non-concatenated, non-admin styles to be processed
	'modules/custom-post-types/comics/comics.css',
	'modules/shortcodes/css/recipes.css',
	'modules/shortcodes/css/recipes-print.css',
	'modules/shortcodes/css/slideshow-shortcode.css',
	'modules/contact-form/css/editor-inline-editing-style.css',
	'modules/contact-form/css/editor-style.css',
	'modules/contact-form/css/editor-ui.css',
	'modules/custom-css/csstidy/cssparse.css',
	'modules/custom-css/csstidy/cssparsed.css',
	'modules/custom-css/custom-css/css/codemirror.css',
	'modules/custom-css/custom-css/css/css-editor.css',
	'modules/custom-css/custom-css/css/use-codemirror.css',
	'modules/post-by-email/post-by-email.css',
	'modules/protect/protect-dashboard-widget.css',
	'modules/sharedaddy/admin-sharing.css',
	'modules/videopress/videopress-admin.css',
	'modules/videopress/css/editor.css',
	'modules/videopress/css/videopress-editor-style.css',
	'modules/widget-visibility/widget-conditions/widget-conditions.css',
	'modules/widgets/gallery/css/admin.css',
	'modules/sso/jetpack-sso-login.css', // Displayed when logging into the site.
	'modules/masterbar/admin-menu/admin-menu.css',
];

// Minimizes admin css for modules.  Outputs to same folder as min.css
gulp.task( 'admincss', function () {
	return gulp
		.src( adminCSSFiles, { base: './' } )
		.pipe( autoprefixer() )
		.pipe( cleanCSS() )
		.pipe( rename( { suffix: '.min' } ) )
		.pipe(
			prepend.prependText(
				'/* Do not modify this file directly.  It is concatenated from individual module CSS files. */\n'
			)
		)
		.pipe( gulp.dest( '.' ) )
		.on( 'end', function () {
			log( 'Admin modules CSS finished.' );
		} );
} );

// Admin RTL CSS for modules.  Auto-prefix, RTL, Minify, RTL the minimized version.
gulp.task( 'admincss:rtl', function () {
	return gulp
		.src( adminCSSFiles, { base: './' } )
		.pipe( autoprefixer() )
		.pipe( rtlcss() )
		.pipe( rename( { suffix: '-rtl' } ) )
		.pipe(
			prepend.prependText(
				'/* Do not modify this file directly.  It is concatenated from individual module CSS files. */\n'
			)
		)
		.pipe( gulp.dest( '.' ) )
		.pipe( cleanCSS() )
		.pipe( rename( { suffix: '.min' } ) )
		.pipe( gulp.dest( '.' ) )
		.on( 'end', function () {
			log( 'Admin modules RTL CSS finished.' );
		} );
} );

export default gulp.parallel( 'admincss', 'admincss:rtl' );

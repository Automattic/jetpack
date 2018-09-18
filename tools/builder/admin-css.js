// Admin CSS to be minified, autoprefixed, rtl

/**
 * External dependencies
 */
import autoprefixer from 'gulp-autoprefixer';
import banner from 'gulp-banner';
import cleanCSS from 'gulp-clean-css';
import gulp from 'gulp';
import rename from 'gulp-rename';
import rtlcss from 'gulp-rtlcss';
import util from 'gulp-util';

const admincss = [
	// Non-concatenated, non-admin styles to be processed
	'modules/custom-post-types/comics/comics.css',
	'modules/shortcodes/css/recipes.css',
	'modules/shortcodes/css/recipes-print.css',
	'modules/shortcodes/css/slideshow-shortcode.css',
	'modules/after-the-deadline/atd.css',
	'modules/after-the-deadline/tinymce/css/content.css',
	'modules/contact-form/css/editor-inline-editing-style.css',
	'modules/contact-form/css/editor-style.css',
	'modules/contact-form/css/editor-ui.css',
	'modules/custom-css/csstidy/cssparse.css',
	'modules/custom-css/csstidy/cssparsed.css',
	'modules/custom-css/custom-css/css/codemirror.css',
	'modules/custom-css/custom-css/css/css-editor.css',
	'modules/custom-css/custom-css/css/use-codemirror.css',
	'modules/post-by-email/post-by-email.css',
	'modules/publicize/assets/publicize.css',
	'modules/protect/protect-dashboard-widget.css',
	'modules/sharedaddy/admin-sharing.css',
	'modules/videopress/videopress-admin.css',
	'modules/videopress/css/editor.css',
	'modules/videopress/css/videopress-editor-style.css',
	'modules/widget-visibility/widget-conditions/widget-conditions.css',
	'modules/widgets/gallery/css/admin.css',
	'modules/sso/jetpack-sso-login.css' // Displayed when logging into the site.
];

// Minimizes admin css for modules.  Outputs to same folder as min.css
gulp.task( 'admincss', function() {
	return gulp.src( admincss, { base: './' } )
		.pipe( autoprefixer( 'last 2 versions', 'ie >= 8' ) )
		.pipe( cleanCSS( { compatibility: 'ie8' } ) )
		.pipe( rename( { suffix: '.min' } ) )
		.pipe( banner(
			'/* Do not modify this file directly.  It is concatenated from individual module CSS files. */\n'
		) )
		.pipe( gulp.dest( '.' ) )
		.on( 'end', function() {
			util.log( 'Admin modules CSS finished.' );
		} );
} );

// Admin RTL CSS for modules.  Auto-prefix, RTL, Minify, RTL the minimized version.
gulp.task( 'admincss:rtl', function() {
	return gulp.src( admincss, { base: './' } )
		.pipe( autoprefixer( 'last 2 versions', 'safari 5', 'ie 8', 'ie 9', 'Firefox 14', 'opera 12.1', 'ios 6', 'android 4' ) )
		.pipe( rtlcss() )
		.pipe( rename( { suffix: '-rtl' } ) )
		.pipe( banner(
			'/* Do not modify this file directly.  It is concatenated from individual module CSS files. */\n'
		) )
		.pipe( gulp.dest( '.' ) )
		.pipe( cleanCSS( { compatibility: 'ie8' } ) )
		.pipe( rename( { suffix: '.min' } ) )
		.pipe( gulp.dest( '.' ) )
		.on( 'end', function() {
			util.log( 'Admin modules RTL CSS finished.' );
		} );
} );

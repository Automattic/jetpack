var autoprefixer = require( 'gulp-autoprefixer' ),
	banner = require( 'gulp-banner' ),
	check = require( 'gulp-check' ),
	cleanCSS = require( 'gulp-clean-css' ),
	concat = require( 'gulp-concat' ),
	gulp = require( 'gulp' ),
	jshint = require( 'gulp-jshint' ),
	path = require( 'path' ),
	phplint = require( 'gulp-phplint' ),
	phpunit = require( 'gulp-phpunit' ),
	qunit = require( 'gulp-qunit' ),
	rename = require( 'gulp-rename' ),
	rtlcss = require( 'gulp-rtlcss' ),
	sass = require( 'gulp-sass' ),
	shell = require( 'gulp-shell' ),
	sourcemaps = require( 'gulp-sourcemaps' ),
	util = require( 'gulp-util' ),
	stylish = require( 'jshint-stylish'),
	uglify = require('gulp-uglify');

/* Admin CSS to be minified, autoprefixed, rtl */
var admincss = [
	'modules/after-the-deadline/atd.css',
	'modules/after-the-deadline/tinymce/css/content.css',
	'modules/contact-form/css/menu-alter.css',
	'modules/custom-css/csstidy/cssparse.css',
	'modules/custom-css/csstidy/cssparsed.css',
	'modules/custom-css/custom-css/css/codemirror.css',
	'modules/custom-css/custom-css/css/css-editor.css',
	'modules/custom-css/custom-css/css/use-codemirror.css',
	'modules/omnisearch/omnisearch.css',
	'modules/omnisearch/omnisearch-jetpack.css',
	'modules/post-by-email/post-by-email.css',
	'modules/publicize/assets/publicize.css',
	'modules/protect/protect-dashboard-widget.css',
	'modules/sharedaddy/admin-sharing.css',
	'modules/videopress/videopress-admin.css',
	'modules/widget-visibility/widget-conditions/widget-conditions.css',
	'modules/widgets/gallery/css/admin.css'
];

/* Front-end CSS to be concatenated */
var frontendcss = [
	'modules/carousel/jetpack-carousel.css',
	'modules/contact-form/css/grunion.css',
	'modules/infinite-scroll/infinity.css',
	'modules/likes/style.css',
	'modules/related-posts/related-posts.css',
	'modules/sharedaddy/sharing.css',
	'modules/shortcodes/css/slideshow-shortcode.css',
	'modules/shortcodes/css/style.css', // TODO: Should be renamed to shortcode-presentations
	'modules/subscriptions/subscriptions.css',
	'modules/theme-tools/responsive-videos/responsive-videos.css',
	'modules/theme-tools/social-menu/social-menu.css',
	'modules/tiled-gallery/tiled-gallery/tiled-gallery.css',
	'modules/widgets/wordpress-post-widget/style.css',
	'modules/widgets/gravatar-profile.css',
	'modules/widgets/goodreads/css/goodreads.css',
	'modules/widgets/social-media-icons/style.css',
	'modules/widgets/top-posts/style.css',
	'modules/widgets/widgets.css' // TODO Moved to image-widget/style.css
];

// Minimizes admin css for modules.  Outputs to same folder as min.css
gulp.task( 'admincss', function() {
	return gulp.src( admincss, { base: './' } )
		.pipe( autoprefixer( 'last 2 versions', 'ie >= 8' ) )
		.pipe( cleanCSS( { compatibility: 'ie8' } ) )
		.pipe( rename( { suffix: '.min' } ) )
		.pipe( banner( '/* Do not modify this file directly.  It is concatenated from individual module CSS files. */\n') )
		.pipe( gulp.dest( '.' ) )
		.on( 'end', function() {
			console.log( 'admin CSS finished.' );
		} );
});

// Admin RTL CSS for modules.  Auto-prefix, RTL, Minify, RTL the minimized version.
gulp.task( 'admincss:rtl', function() {
	return gulp.src( admincss, { base: './' } )
		.pipe( autoprefixer( 'last 2 versions', 'safari 5', 'ie 8', 'ie 9', 'Firefox 14', 'opera 12.1', 'ios 6', 'android 4' ) )
		.pipe( rtlcss() )
		.pipe( rename( { suffix: '-rtl' } ) )
		.pipe( banner( '/* Do not modify this file directly.  It is concatenated from individual module CSS files. */\n') )
		.pipe( gulp.dest( '.' ) )
		.pipe( cleanCSS( { compatibility: 'ie8' } ) )
		.pipe( rename( { suffix: '.min' } ) )
		.pipe( gulp.dest( '.' ) )
		.on( 'end', function() {
			console.log( 'admin RTL CSS finished.' );
		} );
} );

// Frontend CSS.  Auto-prefix and minimize.
gulp.task( 'frontendcss', function() {
	return gulp.src( frontendcss )
		.pipe( autoprefixer( 'last 2 versions', 'safari 5', 'ie 8', 'ie 9', 'Firefox 14', 'opera 12.1', 'ios 6', 'android 4' ) )
		.pipe( cleanCSS( { compatibility: 'ie8' } ) )
		.pipe( concat( 'jetpack.css' ) )
		.pipe( banner( '/*!\n'+
			'* Do not modify this file directly.  It is concatenated from individual module CSS files.\n'+
			'*/\n'
		) )
		.pipe( gulp.dest( 'css' ) )
		.on( 'end', function() {
			console.log( 'front end CSS finished.' );
		} );
});

/*
	Sass!
 */
gulp.task( 'sass', function() {
		return gulp.src( 'scss/*.scss' )
			.pipe( sass( { outputStyle: 'expanded' } ).on( 'error', sass.logError ) )
			.pipe( banner( '/*!\n'+
				'* Do not modify this file directly.  It is compiled SASS code.\n'+
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
				console.log( 'CSS finished.' );
			} );
} );

/*
    Sass! (RTL)
 */
gulp.task( 'sass:rtl', function() {
	return gulp.src( 'scss/*.scss' )
		.pipe( sass( { outputStyle: 'expanded' } ).on( 'error', sass.logError ) )
		.pipe( banner( '/*!\n'+
			'* Do not modify this file directly.  It is compiled SASS code.\n'+
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
			console.log( 'CSS finished.' );
		} );
} );

gulp.task( 'sass:watch', function () {
	gulp.watch( 'scss/*.scss', ['sass'] );
});

/*
	Shell commands
 */
gulp.task( 'shell', shell.task( [
	'echo hello'
], { verbose: true } ) );

/*
	"Check" task
	Search for strings and fail if found.
 */
gulp.task( 'check:DIR', function() {
	// __DIR__ is not available in PHP 5.2...
	return gulp.src( ['*.php', '**/*.php'] )
		.pipe( check( '__DIR__' ) )
		.on( 'error', function( err ) {
			util.log( util.colors.red( err ) );
		} );
} );

/*
	PHP Lint
 */
gulp.task( 'php:lint', function() {
	return gulp.src( [ '!node_modules', '!node_modules/**', '*.php', '**/*.php' ] )
		.pipe( phplint( '', { skipPassedFiles: true } ) );
} );

/*
    PHP Unit
 */
gulp.task( 'php:unit', function() {
	return gulp.src( 'phpunit.xml.dist' )
		.pipe( phpunit( 'phpunit', { colors: 'disabled' } ) )
		.on( 'error', function( err ) {
			util.log( util.colors.red( err ) );
		} );
} );

/*
	JS Hint
 */
gulp.task( 'js:hint', function() {
	return gulp.src( [
		'_inc/*.js',
		'modules/*.js',
		'modules/**/*.js',
		'!_inc/*.min.js',
		'!modules/*.min.',
		'!modules/**/*.min.js'
	] )
		.pipe( jshint( '.jshintrc' ) )
		.pipe( jshint.reporter('jshint-stylish') );
} );

/*
	JS qunit
 */
gulp.task( 'js:qunit', function() {
	return gulp.src( 'tests/qunit/**/*.html' )
		.pipe( qunit() );
});

gulp.task( 'js:uglify', function() {
	return gulp.src( [
		'_inc/*.js',
		'modules/*.js',
		'modules/**/*.js',
		'!_inc/*.min.js',
		'!modules/*.min.',
		'!modules/**/*.min.js',
		// These are excluded because they already have a .min.js version.
		'!modules/shortcodes/js/jmpress.js',
		'!modules/theme-tools/responsive-videos/responsive-videos.js',
		'!modules/theme-tools/site-logo/js/site-logo.js',
		'!modules/theme-tools/site-logo/js/site-logo-control.js',
		'!modules/theme-tools/site-logo/js/site-logo-header-text.js',
		'!modules/custom-css/custom-css/js/codemirror.js'

	], { base: './' } )
		.pipe( uglify() )
		.pipe( rename( { suffix: '.min' } ) )
		.pipe( gulp.dest( '.' ) )
		.on( 'end', function() {
			console.log( 'js:uglify finished.' );
		});
});

// Default task
gulp.task( 'default',      ['styles', 'checkstrings', 'php:lint', 'js:hint'] );

gulp.task( 'js',           ['js:hint'] );
gulp.task( 'php',          ['php:lint', 'php:unit'] );
gulp.task( 'checkstrings', ['check:DIR'] );
gulp.task( 'styles',       ['frontendcss', 'admincss', 'admincss:rtl', 'sass', 'sass:rtl'] );

gulp.task( 'watch',        ['sass:watch'] );

// Travis CI tasks.
gulp.task( 'travis:phpunit', ['php:unit'] );
gulp.task( 'travis:js', ['js:hint', 'js:qunit'] );
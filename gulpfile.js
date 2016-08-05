var autoprefixer = require( 'gulp-autoprefixer' ),
	banner = require( 'gulp-banner' ),
	check = require( 'gulp-check' ),
	cleanCSS = require( 'gulp-clean-css' ),
	concat = require( 'gulp-concat' ),
	del = require( 'del' ),
	fs = require( 'fs' ),
	gulp = require( 'gulp' ),
	gutil = require( 'gulp-util' ),
	glotpress = require( 'glotpress-js' ),
	jshint = require( 'gulp-jshint' ),
	phplint = require( 'gulp-phplint' ),
	phpunit = require( 'gulp-phpunit' ),
	po2json = require( 'gulp-po2json' ),
	qunit = require( 'gulp-qunit' ),
	rename = require( 'gulp-rename' ),
	rtlcss = require( 'gulp-rtlcss' ),
	sass = require( 'gulp-sass' ),
	spawn = require( 'child_process' ).spawn,
	sourcemaps = require( 'gulp-sourcemaps' ),
	util = require( 'gulp-util' ),
	webpack = require( 'webpack' );

var admincss, frontendcss,
	language_packs = require( './language-packs.js' );

function onBuild( done ) {
	return function( err, stats ) {
		// Webpack doesn't populate err in case the build fails
		// @see https://github.com/webpack/webpack/issues/708
		if ( stats.compilation.errors && stats.compilation.errors.length ) {
			if ( done ) {
				done( new gutil.PluginError( 'webpack', stats.compilation.errors[0] ) );
				return; // Otherwise gulp complains about done called twice
			}
		}

		gutil.log( 'Building JS…', stats.toString( {
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
			children: false
		} ), '\nJS finished at', Date.now() );

		if ( done ) {
			doStatic( done );
		} else {
			doStatic();
		}
	};
}

function getWebpackConfig() {
	// clone and extend webpackConfig
	var config = Object.create( require( './webpack.config.js' ) );
	config.devtool = 'sourcemap';
	config.debug = true;

	return config;
}

function doSass() {
	if ( arguments.length ) {
		console.log( 'Sass file ' + arguments[0].path + ' changed.' );
	}
	console.log( 'Building Dashboard CSS bundle...' );
	gulp.src( './_inc/client/scss/style.scss' )
		.pipe( sass( { outputStyle: 'compressed' } ).on( 'error', sass.logError ) )
		.pipe( banner( '/* Do not modify this file directly.  It is compiled SASS code. */\n' ) )
		.pipe( autoprefixer( { browsers: [ 'last 2 versions', 'ie >= 8' ] } ) )
		.pipe( rename( { suffix: '.min' } ) )
		.pipe( gulp.dest( './_inc/build' ) )
		.on( 'end', function() {
			console.log( 'Dashboard CSS finished.' );
		} );
}

gulp.task( 'sass:build', function() {
	doSass();
} );

gulp.task( 'sass:watch', function() {
	doSass();
	gulp.watch( [ './**/*.scss' ], doSass );
} );

gulp.task( 'react:build', function( done ) {
	var config = getWebpackConfig();

	if ( 'production' === process.env.NODE_ENV ) {
		config.plugins = config.plugins.concat(
			new webpack.optimize.DedupePlugin(),
			new webpack.optimize.UglifyJsPlugin( {
				compress: {
					warnings: false
				}
			} )
		);

		config.devtool = 'source-map';
		config.debug = false;
	}

	webpack( config ).run( onBuild( done ) );
} );

gulp.task( 'react:watch', function() {
	var config = getWebpackConfig();

	webpack( config ).watch( 100, onBuild() );
} );

gulp.task( 'react:static', function( done ) {
	doStatic( done );
} );

function doStatic( done ) {
	var path,
		jsdom = require( 'jsdom' );

	gutil.log( 'Building static HTML from built JS…' );

	jsdom.env( '', function( err, window ) {
		global.window = window;
		global.document = window.document;
		global.navigator = window.navigator;

		window.Initial_State = {
			dismissedNotices: [],
			connectionStatus: {
				devMode: {
					isActive: false
				}
			},
			userData: {
				currentUser: {
					permissions: {}
				}
			}
		};

		path = __dirname + '/_inc/build/static.js';

		delete require.cache[ path ]; // Making sure NodeJS requires this file every time this is called
		require( path );

		fs.writeFile( __dirname + '/_inc/build/static.html', window.staticHtml );
		fs.writeFile( __dirname + '/_inc/build/static-noscript-notice.html', window.noscriptNotice );
		fs.writeFile( __dirname + '/_inc/build/static-version-notice.html', window.versionNotice );

		if ( done ) {
			done();
		}
	} );
}

// Admin CSS to be minified, autoprefixed, rtl
//
// Note: Once the Jetpack React UI lands, many of these will likely be able to be removed.

/* (Pre-4.1) Admin CSS to be minified, autoprefixed, rtl */
admincss = [
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
	'modules/widgets/gallery/css/admin.css',
	'modules/sso/jetpack-sso-login.css' // Displayed when logging into the site.
];

/* Front-end CSS to be concatenated */
frontendcss = [
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

gulp.task( 'old-styles:watch', function() {
	gulp.watch( 'scss/**/*.scss', ['old-sass'] );
} );

// Minimizes admin css for modules.  Outputs to same folder as min.css
gulp.task( 'admincss', function() {
	return gulp.src( admincss, { base: './' } )
		.pipe( autoprefixer( 'last 2 versions', 'ie >= 8' ) )
		.pipe( cleanCSS( { compatibility: 'ie8' } ) )
		.pipe( rename( { suffix: '.min' } ) )
		.pipe( banner( '/* Do not modify this file directly.  It is concatenated from individual module CSS files. */\n' ) )
		.pipe( gulp.dest( '.' ) )
		.on( 'end', function() {
			console.log( 'Admin modules CSS finished.' );
		} );
} );

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
			console.log( 'Admin modules RTL CSS finished.' );
		} );
} );

// Frontend CSS.  Auto-prefix and minimize.
gulp.task( 'frontendcss', function() {
	return gulp.src( frontendcss )
		.pipe( autoprefixer( 'last 2 versions', 'safari 5', 'ie 8', 'ie 9', 'Firefox 14', 'opera 12.1', 'ios 6', 'android 4' ) )
		.pipe( cleanCSS( { compatibility: 'ie8' } ) )
		.pipe( concat( 'jetpack.css' ) )
		.pipe( banner( '/*!\n' +
			'* Do not modify this file directly.  It is concatenated from individual module CSS files.\n' +
			'*/\n'
		) )
		.pipe( gulp.dest( 'css' ) )
		.on( 'end', function() {
			console.log( 'Front end modules CSS finished.' );
		} );
} );

/*
	Sass!
 */
gulp.task( 'old-sass', function() {
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
			console.log( 'Global admin CSS finished.' );
		} );
} );

/*
    Sass! (RTL)
 */
gulp.task( 'old-sass:rtl', function() {
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
			console.log( 'Global admin RTL CSS finished.' );
		} );
} );

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
		.pipe( jshint.reporter( 'jshint-stylish' ) )
		.pipe( jshint.reporter( 'fail' ) );
} );

/*
	JS qunit
 */
gulp.task( 'js:qunit', function() {
	return gulp.src( 'tests/qunit/**/*.html' )
		.pipe( qunit() );
} );

/*
	I18n land
*/

gulp.task( 'languages:get', function( callback ) {
	var process = spawn(
		'php',
		[
			'tools/export-translations.php',
			'.',
			'https://translate.wordpress.org/projects/wp-plugins/jetpack/dev'
		]
	);

	process.stderr.on( 'data', function( data ) {
		gutil.log( data.toString() );
	} );
	process.stdout.on( 'data', function( data ) {
		gutil.log( data.toString() );
	} );
	process.on( 'exit', function( code ) {
		if ( 0 !== code ) {
			gutil.log( 'Failed getting languages: process exited with code ', code );
		}
		callback();
	} );
} );

gulp.task( 'languages:build', [ 'languages:get' ], function( ) {
	return gulp.src( [ 'languages/*.po' ] )
		.pipe( po2json() )
		.pipe( gulp.dest( 'languages/json/' ) );
} );

gulp.task( 'languages:cleanup', [ 'languages:build' ], function() {
	return del(
		language_packs.map( function( item ) {
			var locale = item.split( '-' );

			if ( locale.length > 1 ) {
				locale[1] = locale[1].toUpperCase();
				locale = locale.join( '_' );
			} else {
				locale = locale[0];
			}

			return './languages/jetpack-' + locale + '.*';
		} )
	);
} );

gulp.task( 'languages:extract', [ 'react:build' ], function( callback ) {
	glotpress( {
		inputPaths: [ '_inc/build/admin.js' ],
		output: '_inc/jetpack-strings.php',
		format: 'php'
	} );

	callback();
} );

// Default task
gulp.task(
	'default',
	['react:build', 'sass:build', 'old-styles', 'checkstrings', 'php:lint', 'js:hint']
);
gulp.task(
	'watch',
	['react:watch', 'sass:watch', 'old-styles:watch']
);

gulp.task( 'jshint', ['js:hint'] );
gulp.task( 'php', ['php:lint', 'php:unit'] );
gulp.task( 'checkstrings', ['check:DIR'] );

gulp.task(
	'old-styles',
	[ 'frontendcss', 'admincss', 'admincss:rtl', 'old-sass', 'old-sass:rtl' ]
);
gulp.task(
	'languages',
	[ 'languages:get', 'languages:build', 'languages:cleanup', 'languages:extract' ]
);

// travis CI tasks.
gulp.task( 'travis:js', ['js:hint', 'js:qunit'] );

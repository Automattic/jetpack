/**
 * External dependencies
 */
import autoprefixer from 'gulp-autoprefixer';
import babel from 'gulp-babel';
import banner from 'gulp-banner';
import check from 'gulp-check';
import cleanCSS from 'gulp-clean-css';
import colors from 'ansi-colors';
import del from 'del';
import deleteLines from 'gulp-delete-lines';
import fs from 'fs';
import gulp from 'gulp';
import eslint from 'gulp-eslint';
import i18n_calypso from 'i18n-calypso/cli';
import jshint from 'gulp-jshint';
import json_transform from 'gulp-json-transform';
import phplint from 'gulp-phplint';
import phpunit from 'gulp-phpunit';
import PluginError from 'plugin-error';
import po2json from 'gulp-po2json';
import rename from 'gulp-rename';
import request from 'request';
import rtlcss from 'gulp-rtlcss';
import sass from 'gulp-sass';
import { spawn } from 'child_process';
import sourcemaps from 'gulp-sourcemaps';
import tap from 'gulp-tap';
import uglify from 'gulp-uglify';
import log from 'fancy-log';
import webpack from 'webpack';
import gulpif from 'gulp-if';
import saveLicense from 'uglify-save-license';

/**
 * Internal dependencies
 */
const meta = require( './package.json' );

import {} from './tools/builder/frontend-css';
import {} from './tools/builder/admin-css';

// These paths should alawys be ignored when watching files
const alwaysIgnoredPaths = [ '!node_modules/**', '!vendor/**', '!docker/**' ];

function onBuild( done ) {
	return function( err, stats ) {
		// Webpack doesn't populate err in case the build fails
		// @see https://github.com/webpack/webpack/issues/708
		if ( stats.compilation.errors && stats.compilation.errors.length ) {
			if ( done ) {
				done( new PluginError( 'webpack', stats.compilation.errors[ 0 ] ) );
				return; // Otherwise gulp complains about done called twice
			}
		}

		log( 'Building JS…', stats.toString( {
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

		if ( 'production' === process.env.NODE_ENV ) {
			log( 'Uglifying JS...' );
			gulp.src( '_inc/build/admin.js' )
				.pipe( uglify() )
				.pipe( gulp.dest( '_inc/build' ) )
				.on( 'end', function() {
					log( 'Your JS is now uglified!' );
				} );
		}

		const is_prod = 'production' === process.env.NODE_ENV;

		const supportedModules = [
			'shortcodes',
			'widgets',
			'after-the-deadline',
			'widget-visibility',
			'custom-css',
			'publicize',
			'custom-post-types',
			'sharedaddy',
			'contact-form',
			'photon',
			'carousel',
			'related-posts',
			'tiled-gallery',
			'likes',
			'minileven',
			'infinite-scroll',
			'masterbar',
			'videopress',
			'comment-likes',
			'lazy-images',
			'wordads',
		];

		// Source any JS for whitelisted modules, which will minimize us shipping much
		// more JS that we haven't pointed to in PHP yet.
		// Example output: modules/(shortcodes|widgets)/**/*.js
		const supportedModulesSource = `modules/@(${ supportedModules.join( '|' ) })/**/*.js`;

		// Uglify other JS from _inc and supported modules
		const sources = [
			'_inc/*.js',
			supportedModulesSource
		];

		// Don't process minified JS in _inc or modules directories
		const sourceNegations = [
			'!_inc/*.min.js',
			'!modules/**/*.min.js'
		];
		gulp.src( Array.concat( sources, sourceNegations ) )
			.pipe( banner( '/* Do not modify this file directly. It is compiled from other files. */\n' ) )
			.pipe( gulpif( ! is_prod, sourcemaps.init() ) )
			.pipe( uglify( {
				preserveComments: saveLicense
			} ) )
			.pipe( rename( { suffix: '.min' } ) )
			.pipe( gulpif( ! is_prod, sourcemaps.write( 'maps' ) ) ) // Put the maps in _inc/build/maps so that we can easily .svnignore
			.pipe( gulp.dest( '_inc/build' ) )
			.on( 'end', function() {
				log( 'Your other JS is now uglified!' );
			} );

		doSass( function() {
			if ( done ) {
				doStatic( done );
			} else {
				doStatic();
			}
		} );
	};
}

function getWebpackConfig() {
	return Object.create( require( './webpack.config.js' ) );
}

function doSass( done ) {
	if ( arguments.length && typeof arguments[ 0 ] !== 'function' ) {
		log( 'Sass file ' + arguments[ 0 ].path + ' changed.' );
	}
	log( 'Building Dashboard CSS bundle...' );
	gulp.src( './_inc/client/scss/style.scss' )
		.pipe( sass( { outputStyle: 'compressed' } ).on( 'error', sass.logError ) )
		.pipe( banner( '/* Do not modify this file directly.  It is compiled SASS code. */\n' ) )
		.pipe( autoprefixer( { browsers: [ 'last 2 versions', 'ie >= 8' ] } ) )
		.pipe( rename( { suffix: '.min' } ) )
		.pipe( gulp.dest( './_inc/build' ) )
		.on( 'end', function() {
			log( 'Dashboard CSS finished.' );
			doRTL( 'main' );
		} );
	log( 'Building dops-components CSS bundle...' );
	gulp.src( './_inc/build/*dops-style.css' )
		.pipe( autoprefixer( 'last 2 versions', 'ie >= 8' ) )
		.pipe( gulp.dest( './_inc/build' ) )
		.on( 'end', function() {
			log( 'dops-components CSS finished.' );
			doRTL( 'dops', done );
		} );
}

function doRTL( files, done ) {
	gulp.src( 'main' === files ? './_inc/build/style.min.css' : './_inc/build/*dops-style.css' )
		.pipe( rtlcss() )
		.pipe( rename( { suffix: '.rtl' } ) )
		.pipe( sourcemaps.init() )
		.pipe( sourcemaps.write( './' ) )
		.pipe( gulp.dest( './_inc/build' ) )
		.on( 'end', function() {
			log( 'main' === files ? 'Dashboard RTL CSS finished.' : 'DOPS Components RTL CSS finished.' );
			if ( done && 'function' === typeof done ) {
				done();
			}
		} );
}

gulp.task( 'sass:build', [ 'react:build' ], doSass );

gulp.task( 'sass:watch', function() {
	doSass();
	gulp.watch( [ './**/*.scss', ...alwaysIgnoredPaths ], doSass );
} );

gulp.task( 'react:build', function( done ) {
	const config = getWebpackConfig();

	if ( 'production' !== process.env.NODE_ENV ) {
		config.plugins.push(
			new webpack.LoaderOptionsPlugin( {
				debug: true
			} )
		);
	}

	webpack( config ).run( onBuild( done ) );
} );

gulp.task( 'react:watch', function() {
	const config = getWebpackConfig();

	webpack( config ).watch( 100, onBuild() );
} );

function doStatic( done ) {
	let path;

	const jsdom = require( 'jsdom' );

	log( 'Building static HTML from built JS…' );

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

		try {
			path = __dirname + '/_inc/build/static.js';

			delete require.cache[ path ]; // Making sure NodeJS requires this file every time this is called
			require( path );

			gulp.src( [ '_inc/build/static*' ] )
				.pipe( tap( function( file ) {
					fs.unlinkSync( file.path );
				} ) )
				.on( 'end', function() {
					fs.writeFileSync( __dirname + '/_inc/build/static.html', window.staticHtml );
					fs.writeFileSync( __dirname + '/_inc/build/static-noscript-notice.html', window.noscriptNotice );
					fs.writeFileSync( __dirname + '/_inc/build/static-version-notice.html', window.versionNotice );
					fs.writeFileSync( __dirname + '/_inc/build/static-ie-notice.html', window.ieNotice );

					if ( done ) {
						done();
					}
				} );
		} catch ( error ) {
			log( colors.yellow(
				'Warning: gulp was unable to update static HTML files.\n\n' +
				'If this is happening during watch, this warning is OK to dismiss: sometimes webpack fires watch handlers when source code is not yet built.'
			) );
		}
	} );
}

gulp.task( 'old-styles:watch', function() {
	gulp.watch( 'scss/**/*.scss', [ 'old-sass' ] );
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
			log( 'Global admin CSS finished.' );
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
			log( 'Global admin RTL CSS finished.' );
		} );
} );

/*
	"Check" task
	Search for strings and fail if found.
 */
gulp.task( 'check:DIR', function() {
	// __DIR__ is not available in PHP 5.2...
	return gulp.src( [ '*.php', '**/*.php', ...alwaysIgnoredPaths ] )
		.pipe( check( '__DIR__' ) )
		.on( 'error', function( err ) {
			log( colors.red( err ) );
		} );
} );

/*
	PHP Lint
 */
gulp.task( 'php:lint', function() {
	return gulp.src( [ '*.php', '**/*.php', ...alwaysIgnoredPaths ] )
		.pipe( phplint( '', { skipPassedFiles: true } ) );
} );

/*
    PHP Unit
 */
gulp.task( 'php:unit', function() {
	return gulp.src( 'phpunit.xml.dist' )
		.pipe( phpunit( 'phpunit', { colors: 'disabled' } ) )
		.on( 'error', function( err ) {
			log( colors.red( err ) );
		} );
} );

/**
 * eslint
 */
gulp.task( 'eslint', function() {
	return gulp.src( [
		'_inc/client/**/*.js',
		'_inc/client/**/*.jsx',
		'!_inc/client/**/test/*.js'
	] )
		.pipe( eslint() )
		.pipe( eslint.format() )
		.pipe( eslint.failAfterError() );
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
		'!modules/**/*.min.js',
		'!**/*/*block.js',
	] )
		.pipe( jshint( '.jshintrc' ) )
		.pipe( jshint.reporter( 'jshint-stylish' ) )
		.pipe( jshint.reporter( 'fail' ) );
} );

/*
	I18n land
*/

gulp.task( 'languages:get', function( callback ) {
	const process = spawn(
		'php',
		[
			'tools/export-translations.php',
			'.',
			'https://translate.wordpress.org/projects/wp-plugins/jetpack/dev'
		]
	);

	process.stderr.on( 'data', function( data ) {
		log( data.toString() );
	} );
	process.stdout.on( 'data', function( data ) {
		log( data.toString() );
	} );
	process.on( 'exit', function( code ) {
		if ( 0 !== code ) {
			log( 'Failed getting languages: process exited with code ', code );
			// Make the task fail if there was a problem as this could mean that we were going to ship a Jetpack version
			// with the languages not properly built
			return callback( new Error() );
		}
		callback();
	} );
} );

gulp.task( 'languages:build', [ 'languages:get' ], function( done ) {
	const terms = [];

	// Defining global that will be used from jetpack-strings.js
	global.$jetpack_strings = [];
	global.array = function() {};

	// Plural gettext call doesn't make a difference for Jed, the singular value is still used as the key.
	global.__ = global._n = function( term ) {
		terms[ term ] = '';
	};

	// Context prefixes the term and is separated with a unicode character U+0004
	global._x = function( term, context ) {
		terms[ context + '\u0004' + term ] = '';
	};

	gulp.src( [ '_inc/jetpack-strings.php' ] )
		.pipe( deleteLines( {
			filters: [ /<\?php/ ]
		} ) )
		.pipe( rename( 'jetpack-strings.js' ) )
		.pipe( gulp.dest( '_inc' ) )
		.on( 'end', function() {
			// Requiring the file that will call __, _x and _n
			require( './_inc/jetpack-strings.js' );

			return gulp.src( [ 'languages/*.po' ] )
				.pipe( po2json() )
				.pipe( json_transform( function( data ) {
					const filtered = {
						'': data[ '' ]
					};

					Object.keys( data ).forEach( function( term ) {
						if ( terms.hasOwnProperty( term ) ) {
							filtered[ term ] = data[ term ];
						}
					} );

					return filtered;
				} ) )
				.pipe( gulp.dest( 'languages/json/' ) )
				.on( 'end', function() {
					fs.unlinkSync( './_inc/jetpack-strings.js' );
					done();
				} );
		} );
} );

gulp.task( 'php:module-headings', function( callback ) {
	const process = spawn(
		'php',
		[
			'tools/build-module-headings-translations.php'
		]
	);

	process.stderr.on( 'data', function( data ) {
		log( data.toString() );
	} );
	process.stdout.on( 'data', function( data ) {
		log( data.toString() );
	} );
	process.on( 'exit', function( code ) {
		if ( 0 !== code ) {
			log( 'Failed building module headings translations: process exited with code ', code );
		}
		callback();
	} );
} );

gulp.task( 'languages:cleanup', [ 'languages:build' ], function( done ) {
	const language_packs = [];

	request(
		'https://api.wordpress.org/translations/plugins/1.0/?slug=jetpack&version=' + meta.version,
		function( error, response, body ) {
			if ( error || 200 !== response.statusCode ) {
				done( 'Failed to reach wordpress.org translation API: ' + error );
			}

			body = JSON.parse( body );

			body.translations.forEach( function( language ) {
				language_packs.push( './languages/jetpack-' + language.language + '.*' );
			} );

			log( 'Cleaning up languages for which Jetpack has language packs:' );
			del( language_packs ).then( function( paths ) {
				paths.forEach( function( item ) {
					log( item );
				} );
				done();
			} );
		}
	);
} );

gulp.task( 'languages:extract', function( done ) {
	const paths = [];

	gulp.src( [ '_inc/client/**/*.js', '_inc/client/**/*.jsx' ] )
		.pipe( tap( function( file ) {
			paths.push( file.path );
		} ) )
		.on( 'end', function() {
			i18n_calypso( {
				projectName: 'Jetpack',
				inputPaths: paths,
				output: '_inc/jetpack-strings.php',
				phpArrayName: 'jetpack_strings',
				format: 'PHP',
				textdomain: 'jetpack',
				keywords: [ 'translate', '__' ]
			} );

			done();
		} );
} );

/*
 * Gutenpack!
 */
gulp.task( 'gutenpack', function() {
	return gulp.src( [ '**/*/*block.jsx', ...alwaysIgnoredPaths ] )
		.pipe( babel( {
			plugins: [
				[
					'transform-react-jsx', {
						pragma: 'wp.element.createElement'
					}
				]
			],
		} ) )
		.on( 'error', function( err ) {
			log( colors.red( err ) );
		} )
		.pipe( gulp.dest( './' ) );
} );

gulp.task( 'gutenpack:watch', function() {
	return gulp.watch( [ '**/*/*block.jsx', ...alwaysIgnoredPaths ], [ 'gutenpack' ] );
} );

// Default task
gulp.task(
	'default',
	[ 'react:build', 'old-styles', 'checkstrings', 'php:lint', 'js:hint', 'php:module-headings', 'gutenpack' ]
);
gulp.task(
	'watch',
	[ 'react:watch', 'sass:watch', 'old-styles:watch', 'gutenpack:watch' ]
);

gulp.task( 'jshint', [ 'js:hint' ] );
gulp.task( 'php', [ 'php:lint', 'php:unit' ] );
gulp.task( 'checkstrings', [ 'check:DIR' ] );

gulp.task(
	'old-styles',
	[ 'frontendcss', 'admincss', 'admincss:rtl', 'old-sass', 'old-sass:rtl' ]
);
gulp.task(
	'languages',
	[ 'languages:get', 'languages:build', 'languages:cleanup', 'languages:extract' ]
);

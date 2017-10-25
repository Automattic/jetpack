/**
 * External dependencies
 */
import autoprefixer from 'gulp-autoprefixer';
import babel from 'gulp-babel';
import banner from 'gulp-banner';
import check from 'gulp-check';
import cleanCSS from 'gulp-clean-css';
import del from 'del';
import fs from 'fs';
import gulp from 'gulp';
import eslint from 'gulp-eslint';
import i18n_calypso from 'i18n-calypso/cli';
import jshint from 'gulp-jshint';
import json_transform from 'gulp-json-transform';
import phplint from 'gulp-phplint';
import phpunit from 'gulp-phpunit';
import po2json from 'gulp-po2json';
import qunit from 'gulp-qunit';
import rename from 'gulp-rename';
import readline from 'readline';
import request from 'request';
import rtlcss from 'gulp-rtlcss';
import sass from 'gulp-sass';
import { spawn } from 'child_process';
import Stream from 'stream';
import sourcemaps from 'gulp-sourcemaps';
import tap from 'gulp-tap';
import uglify from 'gulp-uglify';
import util from 'gulp-util';
import webpack from 'webpack';

/**
 * Internal dependencies
 */
const meta = require( './package.json' );

import {} from './tools/builder/frontend-css';
import {} from './tools/builder/admin-css';

function onBuild( done ) {
	return function( err, stats ) {
		// Webpack doesn't populate err in case the build fails
		// @see https://github.com/webpack/webpack/issues/708
		if ( stats.compilation.errors && stats.compilation.errors.length ) {
			if ( done ) {
				done( new util.PluginError( 'webpack', stats.compilation.errors[ 0 ] ) );
				return; // Otherwise gulp complains about done called twice
			}
		}

		util.log( 'Building JS…', stats.toString( {
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
			util.log( 'Uglifying JS...' );
			gulp.src( '_inc/build/admin.js' )
				.pipe( uglify() )
				.pipe( gulp.dest( '_inc/build' ) )
				.on( 'end', function() {
					util.log( 'Your JS is now uglified!' );
				} );
		}

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
	// clone and extend webpackConfig
	const config = Object.create( require( './webpack.config.js' ) );
	config.debug = true;

	return config;
}

function doSass( done ) {
	if ( arguments.length && typeof arguments[ 0 ] !== 'function' ) {
		util.log( 'Sass file ' + arguments[ 0 ].path + ' changed.' );
	}
	util.log( 'Building Dashboard CSS bundle...' );
	gulp.src( './_inc/client/scss/style.scss' )
		.pipe( sass( { outputStyle: 'compressed' } ).on( 'error', sass.logError ) )
		.pipe( banner( '/* Do not modify this file directly.  It is compiled SASS code. */\n' ) )
		.pipe( autoprefixer( { browsers: [ 'last 2 versions', 'ie >= 8' ] } ) )
		.pipe( rename( { suffix: '.min' } ) )
		.pipe( gulp.dest( './_inc/build' ) )
		.on( 'end', function() {
			util.log( 'Dashboard CSS finished.' );
			doRTL( 'main' );
		} );
	util.log( 'Building dops-components CSS bundle...' );
	gulp.src( './_inc/build/*dops-style.css' )
		.pipe( autoprefixer( 'last 2 versions', 'ie >= 8' ) )
		.pipe( gulp.dest( './_inc/build' ) )
		.on( 'end', function() {
			util.log( 'dops-components CSS finished.' );
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
			util.log( 'main' === files ? 'Dashboard RTL CSS finished.' : 'DOPS Components RTL CSS finished.' );
			if ( done && 'function' === typeof done ) {
				done();
			}
		} );
}

gulp.task( 'sass:build', [ 'react:build' ], doSass );

gulp.task( 'sass:watch', function() {
	doSass();
	gulp.watch( [ './**/*.scss' ], doSass );
} );

gulp.task( 'react:build', function( done ) {
	const config = getWebpackConfig();

	if ( 'production' === process.env.NODE_ENV ) {
		config.debug = false;
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

	util.log( 'Building static HTML from built JS…' );

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
					fs.writeFile( __dirname + '/_inc/build/static.html', window.staticHtml );
					fs.writeFile( __dirname + '/_inc/build/static-noscript-notice.html', window.noscriptNotice );
					fs.writeFile( __dirname + '/_inc/build/static-version-notice.html', window.versionNotice );
					fs.writeFile( __dirname + '/_inc/build/static-ie-notice.html', window.ieNotice );

					if ( done ) {
						done();
					}
				} );
		} catch ( error ) {
			util.log( util.colors.yellow(
				"Warning: gulp was unable to update static HTML files.\n\n" +
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
			util.log( 'Global admin CSS finished.' );
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
			util.log( 'Global admin RTL CSS finished.' );
		} );
} );

/*
	"Check" task
	Search for strings and fail if found.
 */
gulp.task( 'check:DIR', function() {
	// __DIR__ is not available in PHP 5.2...
	return gulp.src( [ '*.php', '**/*.php' ] )
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
	const process = spawn(
		'php',
		[
			'tools/export-translations.php',
			'.',
			'https://translate.wordpress.org/projects/wp-plugins/jetpack/dev'
		]
	);

	process.stderr.on( 'data', function( data ) {
		util.log( data.toString() );
	} );
	process.stdout.on( 'data', function( data ) {
		util.log( data.toString() );
	} );
	process.on( 'exit', function( code ) {
		if ( 0 !== code ) {
			util.log( 'Failed getting languages: process exited with code ', code );
		}
		callback();
	} );
} );

gulp.task( 'languages:build', [ 'languages:get' ], function( done ) {
	let terms = [];
	const instream = fs.createReadStream( './_inc/jetpack-strings.php' );
	const outstream = new Stream;
	outstream.readable = true;
	outstream.writable = true;

	const rl = readline.createInterface( {
		input: instream,
		output: outstream,
		terminal: false
	} );

	rl.on( 'line', function( line ) {
		const brace_index = line.indexOf( '__(' );

		// Skipping lines that do not call translation functions
		if ( -1 === brace_index ) {
			return;
		}

		line = line
			.slice( brace_index + 3, line.lastIndexOf( ')' ) )
			.replace( /[\b\f\n\r\t]/g, ' ' );

		// Making the line look like a JSON array to parse it as such later
		line = [ '[', line.trim(), ']' ].join( '' );

		terms.push( line );
	} ).on( 'close', function() {
		// Extracting only the first argument to the translation function
		terms = JSON.parse( '[' + terms.join( ',' ) + ']' ).map( function( term ) {
			return term[ 0 ];
		} );

		gulp.src( [ 'languages/*.po' ] )
			.pipe( po2json() )
			.pipe( json_transform( function( data ) {
				const filtered = {
					'': data[ '' ]
				};

				Object.keys( data ).forEach( function( term ) {
					if ( -1 !== terms.indexOf( term ) ) {
						filtered[ term ] = data[ term ];
					}
				} );

				return filtered;
			} ) )
			.pipe( gulp.dest( 'languages/json/' ) )
			.on( 'end', done );
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
		util.log( data.toString() );
	} );
	process.stdout.on( 'data', function( data ) {
		util.log( data.toString() );
	} );
	process.on( 'exit', function( code ) {
		if ( 0 !== code ) {
			util.log( 'Failed building module headings translations: process exited with code ', code );
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

			util.log( 'Cleaning up languages for which Jetpack has language packs:' );
			del( language_packs ).then( function( paths ) {
				paths.forEach( function( item ) {
					util.log( item );
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
	return gulp.src( '**/*/*block.jsx' )
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
			util.log( util.colors.red( err ) );
		} )
		.pipe( gulp.dest( './' ) );
} );

gulp.task( 'gutenpack:watch', function() {
	return gulp.watch( [ '**/*/*block.jsx' ], [ 'gutenpack' ] );
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

// travis CI tasks.
gulp.task( 'travis:js', [ 'js:hint', 'js:qunit' ] );

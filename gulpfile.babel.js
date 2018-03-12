/**
 * External dependencies
 */
import babel from 'gulp-babel';
import check from 'gulp-check';
import colors from 'ansi-colors';
import fs from 'fs';
import del from 'del';
import gulp from 'gulp';
import eslint from 'gulp-eslint';
import i18n_calypso from 'i18n-calypso/cli';
import jshint from 'gulp-jshint';
import json_transform from 'gulp-json-transform';
import log from 'fancy-log';
import phplint from 'gulp-phplint';
import phpunit from 'gulp-phpunit';
import po2json from 'gulp-po2json';
import qunit from 'gulp-qunit';
import readline from 'readline';
import request from 'request';
import tap from 'gulp-tap';
import { spawn } from 'child_process';
import Stream from 'stream';

/**
 * Internal dependencies
 */
const meta = require( './package.json' );

import {} from './tools/builder/frontend-css';
import {} from './tools/builder/admin-css';
import {} from './tools/builder/react';
import {} from './tools/builder/sass';

gulp.task( 'sass:watch', function() {
	return gulp.watch( [ './**/*.scss' ], gulp.parallel( 'sass:dashboard', 'sass:dops', 'sass:old' ) );
} );

gulp.task( 'old-styles:watch', function() {
	return gulp.watch( 'scss/**/*.scss', gulp.parallel( 'old-styles' ) );
} );

/*
	"Check" task
	Search for strings and fail if found.
 */
gulp.task( 'check:DIR', function() {
	// __DIR__ is not available in PHP 5.2...
	return gulp.src( [ '!vendor', '!vendor/**', '*.php', '**/*.php' ] )
		.pipe( check( '__DIR__' ) )
		.on( 'error', function( err ) {
			log( colors.red( err ) );
		} );
} );

/*
	PHP Lint
 */
gulp.task( 'php:lint', function() {
	return gulp.src( [ '!node_modules', '!node_modules/**', '!vendor', '!vendor/**', '*.php', '**/*.php' ] )
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

gulp.task( 'languages:build', gulp.series( 'languages:get', function( done ) {
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
} ) );

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

gulp.task( 'languages:cleanup', gulp.series( 'languages:build', function( done ) {
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
} ) );

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
			log( colors.red( err ) );
		} )
		.pipe( gulp.dest( './' ) );
} );

gulp.task( 'gutenpack:watch', function() {
	return gulp.watch( [ '**/*/*block.jsx' ], [ 'gutenpack' ] );
} );

gulp.task(
	'old-styles',
	gulp.parallel( 'frontendcss', 'admincss', 'admincss:rtl', 'sass:old' )
);
gulp.task( 'jshint', gulp.parallel( 'js:hint' ) );
gulp.task( 'php', gulp.parallel( 'php:lint', 'php:unit' ) );
gulp.task( 'checkstrings', gulp.parallel( 'check:DIR' ) );

// Default task
gulp.task(
	'default',
	gulp.parallel( 'sass:build', 'old-styles', 'checkstrings', 'php:lint', 'js:hint', 'php:module-headings', 'gutenpack' )
);
gulp.task(
	'watch',
	gulp.parallel( 'react:watch', 'sass:watch', 'old-styles:watch', 'gutenpack:watch' )
);

gulp.task(
	'languages',
	gulp.parallel( 'languages:get', 'languages:build', 'languages:cleanup', 'languages:extract' )
);

// travis CI tasks.
gulp.task( 'travis:js', gulp.parallel( 'js:hint', 'js:qunit' ) );

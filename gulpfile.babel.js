/**
 * External dependencies
 */
import gulp from 'gulp';
import log from 'fancy-log';
import minimist from 'minimist';
import { exec, spawn } from 'child_process';

/**
 * Internal dependencies
 */
import frontendcss from './tools/builder/frontend-css';
import admincss from './tools/builder/admin-css';
import { watch as react_watch, build as react_build } from './tools/builder/react';
import {
	watch as sass_watch,
	build as sass_build,
	watchPackages as sass_watch_packages,
} from './tools/builder/sass';

const argv = minimist( process.argv.slice( 2 ) );
const { s: sandbox } = argv;

/**
 * Like gulp.series but allows receiving falsy arguments so to ignore them
 *
 * Useful for conditionally adding a subtask to gulp task.
 *
 * @param  {...any} taskArray - Array of tasks to be passed to gulp.series if not falsy.
 * @returns {Array} - The filtered tasks
 */
function conditionalSeries( ...taskArray ) {
	const truthyTasks = taskArray.filter( task => task );
	return gulp.series( ...truthyTasks );
}

/**
 * Pushes built code to sandbox for testing.
 *
 * @returns {null} - Returns nothing
 */
function pushToSandbox() {
	return exec( `./bin/sandbox -s ${ sandbox } push` );
}

gulp.task( 'old-styles:watch', function () {
	return gulp.watch( 'scss/**/*.scss', gulp.parallel( 'old-styles' ) );
} );

gulp.task( 'blocks:watch', function () {
	const child = require( 'child_process' ).execFile( 'yarn', [ 'build-extensions', '--watch' ] );

	child.stdout.on( 'data', function ( data ) {
		log( data.toString() );
	} );
} );

gulp.task( 'search:watch', function () {
	const child = require( 'child_process' ).execFile( 'yarn', [
		'build-search:scripts',
		'--watch',
	] );

	child.stdout.on( 'data', function ( data ) {
		log( data.toString() );
	} );
} );

gulp.task( 'php:module-headings', function ( callback ) {
	const process = spawn( 'php', [ 'tools/build-module-headings-translations.php' ] );
	process.stderr.on( 'data', function ( data ) {
		log( data.toString() );
	} );
	process.stdout.on( 'data', function ( data ) {
		log( data.toString() );
	} );
	process.on( 'exit', function ( code ) {
		if ( 0 !== code ) {
			log( 'Failed building module headings translations: process exited with code ', code );
		}
		callback();
	} );
} );

gulp.task( 'old-styles', gulp.parallel( frontendcss, admincss, 'sass:old', 'sass:packages' ) );

// Default task
gulp.task(
	'default',
	gulp.series( gulp.parallel( react_build, 'old-styles', 'php:module-headings' ), sass_build )
);
gulp.task(
	'watch',
	conditionalSeries(
		gulp.parallel(
			react_watch,
			sass_watch,
			sass_watch_packages,
			'old-styles:watch',
			'blocks:watch',
			'search:watch'
		),
		sandbox && pushToSandbox
	)
);

// Keeping explicit task names to allow for individual runs
gulp.task( 'sass:build', sass_build );
gulp.task( 'react:build', react_build );
gulp.task( 'sass:watch', gulp.parallel( sass_watch, sass_watch_packages ) );
gulp.task( 'react:watch', react_watch );

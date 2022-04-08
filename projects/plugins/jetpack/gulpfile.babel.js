/**
 * External dependencies
 */
import gulp from 'gulp';
import log from 'fancy-log';
import { spawn } from 'child_process';

/**
 * Internal dependencies
 */
import { watch as react_watch, build as react_build } from './tools/builder/react';

gulp.task( 'blocks:watch', function () {
	const child = require( 'child_process' ).execFile( 'pnpm', [
		'run',
		'build-extensions',
		'--',
		'--watch',
	] );

	child.stdout.on( 'data', function ( data ) {
		log( data.toString() );
	} );
} );

gulp.task( 'widget-visibility:watch', function () {
	const child = require( 'child_process' ).execFile( 'pnpm', [
		'run',
		'build-widget-visibility',
		'--',
		'--watch',
	] );
	child.stdout.on( 'data', data => log( data.toString() ) );
} );

gulp.task( 'php:module-headings', function () {
	const process = spawn( 'php', [ 'tools/build-module-headings-translations.php' ] );
	process.stderr.on( 'data', function ( data ) {
		log( data.toString() );
	} );
	process.stdout.on( 'data', function ( data ) {
		log( data.toString() );
	} );
	return process;
} );

// Default task
gulp.task( 'default', gulp.series( gulp.parallel( react_build, 'php:module-headings' ) ) );
gulp.task( 'watch', gulp.parallel( react_watch, 'blocks:watch', 'widget-visibility:watch' ) );

// Keeping explicit task names to allow for individual runs
gulp.task( 'react:build', react_build );
gulp.task( 'react:watch', react_watch );

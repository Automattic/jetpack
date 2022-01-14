/**
 * External dependencies
 */
import gulp from 'gulp';
import log from 'fancy-log';
import { spawn } from 'child_process';

/**
 * Internal dependencies
 */
import frontendcss, {
	frontendCSSSeparateFilesList,
	frontendCSSConcatFilesList,
} from './tools/builder/frontend-css';
import admincss, { adminCSSFiles } from './tools/builder/admin-css';
import { watch as react_watch, build as react_build } from './tools/builder/react';
import { watch as sass_watch, build as sass_build } from './tools/builder/sass';

gulp.task( 'old-styles:watch', function () {
	return gulp.watch(
		[
			'scss/**/*.scss',
			...adminCSSFiles,
			...frontendCSSSeparateFilesList,
			...frontendCSSConcatFilesList,
		],
		gulp.parallel( 'old-styles' )
	);
} );

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

gulp.task( 'old-styles', gulp.parallel( frontendcss, admincss, 'sass:old' ) );

// Default task
gulp.task(
	'default',
	gulp.series( gulp.parallel( react_build, 'old-styles', 'php:module-headings' ), sass_build )
);
gulp.task(
	'watch',
	gulp.parallel(
		react_watch,
		sass_watch,
		'old-styles:watch',
		'blocks:watch',
		'widget-visibility:watch'
	)
);

// Keeping explicit task names to allow for individual runs
gulp.task( 'sass:build', sass_build );
gulp.task( 'react:build', react_build );
gulp.task( 'sass:watch', sass_watch );
gulp.task( 'react:watch', react_watch );

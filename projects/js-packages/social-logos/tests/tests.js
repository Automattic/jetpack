#!/usr/bin/env node
/* eslint-disable no-console, no-process-exit */

// Exit codes:
//   0: All is well
//   1: SVG build files are missing
//   2: The production build isn't clean
//   3: SVG optimization checks failed
//   4: Other build files are missing

const { spawnSync } = require( 'child_process' );
const fs = require( 'fs' );
const glob = require( 'glob' ); // Add this line to import the 'glob' module

const helperFilesDir = 'tests/helper_files/';
const svgSrcDir = 'src/svg/';
const buildDir = 'build/';
const svgBuildDir = buildDir + 'svg-clean/';

// Start in the right folder.
const rootDir = __dirname + '/..';
process.chdir( rootDir );

/**
 * Checks that each SVG file in the source folder has an equivalent file in the build folder.
 */
function checkSVGBuilds() {
	console.log( 'Verifying all SVGs were built...' );
	const srcSVGs = glob.sync( '*.svg', { cwd: svgSrcDir } );
	const builtSVGs = glob.sync( '*.svg', { cwd: svgBuildDir } );
	for ( const srcSVG of srcSVGs ) {
		if ( ! builtSVGs.includes( srcSVG ) ) {
			console.error( `Built SVG file not found: ${ srcSVG }` );
			process.exit( 1 );
		}
	}
	console.log( 'All SVGs were built.' );
}

/**
 * Verifies the SVG optimization is working.
 */
function verifySVGOptimization() {
	console.log( 'Verifying SVG optimization...' );
	// Using the last SVG file, as the optimization tends to go in alphabetical order.
	const testSVG = helperFilesDir + 'youtube.svg';
	const builtSVG = svgBuildDir + 'youtube.svg';

	// Compare testSVG and buildSVG
	const testSVGContent = fs.readFileSync( testSVG, 'utf8' );
	const builtSVGContent = fs.readFileSync( builtSVG, 'utf8' );
	if ( testSVGContent !== builtSVGContent ) {
		console.error( 'Optimization appears to have failed! These files do not match:' );
		console.error( `  - ${ testSVG }` );
		console.error( `  - ${ builtSVG }` );
		process.exit( 3 );
	}

	console.log( 'SVG optimization appears to have worked.' );
}

/**
 * Verify the other build files are present.
 *
 * Basically this checks all files other than the svg-clean dir, which
 * is checked separately in `checkSVGBuilds()`.
 */
function verifyOtherBuildFiles() {
	// Here lie all expected built files (without the build folder prefix).
	const expectedBuildFiles = [
		'css/example.css',
		'font/codepoints.json',
		'font/social-logos.css',
		'font/social-logos.woff2',
		'react/stories/index.stories.d.ts',
		'react/stories/index.stories.js',
		'react/example.d.ts',
		'react/example.js',
		'react/index.d.ts',
		'react/index.js',
		'react/social-logo-data.d.ts',
		'react/social-logo-data.js',
		'react/social-logo.d.ts',
		'react/social-logo.js',
		'svg-sprite/example.html',
		'svg-sprite/social-logos.svg',
	];
	console.log( 'Verifying other build files...' );

	const actualBuildFiles = glob.sync( '**', {
		cwd: buildDir,
		ignore: 'svg-clean/**',
		nodir: true,
	} );

	let missingFileCount = 0;
	expectedBuildFiles.forEach( file => {
		if ( ! actualBuildFiles.includes( file ) ) {
			console.error( 'Missing build file: ' + buildDir + file );
			missingFileCount++;
		}
	} );

	if ( missingFileCount ) {
		process.exit( 4 );
	}
}

/**
 * Verifies the source dir is clean (no uncommitted changed files).
 *
 * When adding a new icon, it will generate new `src/font/codepoints.json` and
 * `src/react/social-logo-data.tsx` files. This is expected during a dev build,
 * but those changes should be committed and no changes should occur when
 * building for production.
 */
function verifySourceIsClean() {
	console.log( 'Checking for changed source files...' );
	const gitDiff = spawnSync( 'git', [ 'diff', '--exit-code', '--stat', './src' ] );
	if ( gitDiff.status ) {
		console.error( gitDiff.stdout.toString().replace( /\n$/, '' ) );
		console.error( 'Production builds should not change the ./src folder!' );
		console.error( 'Did you forget to commit changes?' );
		process.exit( 2 );
	}
	console.log( 'Production build is clean.' );
}

console.log( 'Running post-build tests...' );
checkSVGBuilds();
verifySVGOptimization();
verifyOtherBuildFiles();
verifySourceIsClean();
console.log( 'Everything checks out! Carry on.' );

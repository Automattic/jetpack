#!/usr/bin/env node

// eslint-disable-next-line no-global-assign
require = require( 'esm' )( module /*, options*/ );
/* eslint-disable no-console, no-process-exit */
const execSync = require( 'child_process' ).execSync;
const chalk = require( 'chalk' );
const allProjects = require( '../../cli/helpers/projectHelpers' ).allProjects;

// Initialize variables
let exitCode = 0;
const branch = getCurrentBranch(); // current branch we're on
const diffFiles = getDiffFiles(); // files that have been changed in this branch

// Check if any touched files need a changelog file
console.log( chalk.green( 'Checking if changelog files are needed. Just a sec...' ) );
const needChangelog = checkNeedChangelog();

// If files require a changelog, check and see if one is included already
if ( needChangelog ) {
	// Iterate through projects that may need a changelog
	for ( const proj of needChangelog ) {
		const regexString = '^projects/' + proj + '/changelog/([^/]+)'; // regex matching a changelog file, ex: projects/plugins/jetpack/changelog/file_name
		const regex = new RegExp( regexString );
		// See if any diffed files indicate a changelog file was added
		for ( const file of diffFiles ) {
			const match = file.match( regex );
			if ( match ) {
				console.log( `Found changelog file for ${ proj }` );
				// If match, remove from needChangelog array.
				//needChangelog.splice( needChangelog.indexOf(proj), 1);
			}
		}
	}
}

// If there are projects that still need a changelog file, notify the pusher.
if ( needChangelog.length ) {
	console.log(
		chalk.rgb( 255, 136, 0 )( 'Looks like some projects still need changelog files: ' )
	);
	for ( const proj of needChangelog ) {
		console.logchalk.rgb( ( 255, 136, 0 )( `     ${ proj }` ) );
	}

	console.log( chalk.bgRed( `Pre-push hook failed. Missing required changelog files.` ) );

	console.log(
		chalk.red(
			`Use 'jetpack changelog add' to add changelog files for the above projects.\nUse 'git push --no-verify' to skip this check and push anyway (but then the GitHub action check is gonna get you!)`
		)
	);

	exitCode = 1;
}

/**
 * Get the current branch name that we're on.
 *
 * @returns {string} current branch that we're on.
 */
function getCurrentBranch() {
	return execSync( `git branch --show-current` ).toString().trim();
}

/**
 * Get list of files that this branch has touched.
 *
 * @returns {Array} List of files that are changed in this branch against master.
 */
function getDiffFiles() {
	return execSync( `git diff master...${ branch } --name-only` ).toString().trim().split( '\n' );
}

/**
 * Return a list of projects that this diff has touched that require a changelog.
 *
 * @returns {Array} List of files that require a changelog.
 */
function checkNeedChangelog() {
	const re = /^projects\/([^/]+\/[^/]+)\//; // regex matches project file path, ie 'project/packages/connection/..'
	const modifiedProjects = new Set();
	for ( const file of diffFiles ) {
		const match = file.match( re );
		if ( match ) {
			modifiedProjects.add( match[ 1 ] );
		}
	}

	return allProjects().filter( proj => modifiedProjects.has( proj ) );
}

process.exit( exitCode );

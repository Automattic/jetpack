#!/usr/bin/env node

/* eslint-disable no-console, no-process-exit */
const { execSync, spawnSync } = require( 'child_process' );
const chalk = require( 'chalk' );
const glob = require( 'glob' );

// Initialize variables
const allProjects = glob
	.sync( 'projects/*/*/composer.json', { cwd: __dirname + '/../../../' } )
	.map( p => p.substring( 9, p.length - 14 ) );
const branch = getCurrentBranch(); // Current branch we're on
const diffFiles = getDiffFiles(); // Files that have been changed in this branch
const needChangelog = checkNeedChangelog( allProjects ); // Check if any touched files need a changelog file

console.log( chalk.green( 'Checking if changelog files are needed. Just a sec...' ) );

// If files require a changelog, check and see if one is included already
if ( needChangelog.length ) {
	const hasChangelog = [];
	// Iterate through projects that may need a changelog
	for ( const proj of needChangelog ) {
		// See if any diffed files indicate a changelog file was added
		for ( const file of diffFiles ) {
			if ( file.startsWith( `/projects/${ proj }/changelog/` ) ) {
				console.log( `Found changelog file for ${ proj }` );
				// If match, add it to an array.
				hasChangelog.push( proj );
				break;
			}
		}
	}
	// Remove projects that need changelog if they already have one.
	for ( const proj of hasChangelog ) {
		needChangelog.splice( needChangelog.indexOf( proj ), 1 );
	}
}

// If there are projects that still need a changelog file, notify the pusher.
if ( needChangelog.length ) {
	console.log(
		chalk.rgb( 255, 136, 0 )( `Looks like some projects still need changelog files:\n` )
	);
	for ( const proj of needChangelog ) {
		console.log( chalk.rgb( 255, 136, 0 )( `     ${ proj }` ) );
	}
	console.log(
		chalk.rgb(
			255,
			136,
			0
		)( `\nUse 'jetpack changelog add' to add changelog files for the above project(s).` )
	);
	console.log( chalk.bgRed( `Pre-push hook failed. Missing required changelog files.` ) );

	process.exitCode = 1;
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
	return spawnSync( 'git', [
		'-c',
		'core.quotepath=off',
		'diff',
		`origin/master...${ branch }`,
		`--no-renames`,
		'--name-only',
	] )
		.toString()
		.trim()
		.split( '\n' );
}

/**
 * Return a list of projects that this diff has touched that require a changelog.
 *
 * @param {Array} projects - list of all projects in the monorepo.
 *
 * @returns {Array} List of files that require a changelog.
 */
function checkNeedChangelog( projects ) {
	const re = /^projects\/([^/]+\/[^/]+)\//; // regex matches project file path, ie 'project/packages/connection/..'
	const modifiedProjects = new Set();
	for ( const file of diffFiles ) {
		const match = file.match( re );
		if ( match ) {
			modifiedProjects.add( match[ 1 ] );
		}
	}

	return projects.filter( proj => modifiedProjects.has( proj ) );
}

process.exitCode;

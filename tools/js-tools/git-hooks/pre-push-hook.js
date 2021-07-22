#!/usr/bin/env node

/* eslint-disable no-console, no-process-exit */
const { execSync, spawnSync } = require( 'child_process' );
const chalk = require( 'chalk' );
const glob = require( 'glob' );
const fs = require( 'fs' );

// Initialize variables
const allProjects = glob
	.sync( 'projects/*/*/composer.json', { cwd: __dirname + '/../../../' } )
	.map( p => p.substring( 9, p.length - 14 ) );
const branch = getCurrentBranch(); // Current branch we're on
const diffFiles = getDiffFiles(); // Files that have been changed in this branch
const needChangelog = new Set( checkNeedChangelog( allProjects ) );
// Check if any touched files need a changelog file
console.log( chalk.green( 'Checking if changelog files are needed. Just a sec...' ) );

// Get a list of projects that need a changelog
// Read the project's composer.json
// Check for .extra.changelogger.changelog or .extra.changelogger.changes-dir
// If the only changes included are those files, ignore the

// If files require a changelog, check and see if one is included already
if ( needChangelog.size !== 0 ) {
	// Iterate through projects that may need a changelog
	for ( const proj of needChangelog ) {
		// See if any diffed files indicate a changelog file was added
		for ( const file of diffFiles ) {
			if ( file.startsWith( `projects/${ proj }/changelog/` ) ) {
				console.log( `Found changelog file for ${ proj }` );
				// If match, delete it from needChangelog
				needChangelog.delete( proj );
				break;
			}
		}
	}
}

// If there are projects that still need a changelog file, notify the pusher.
if ( needChangelog.size !== 0 ) {
	console.log( chalk.red( `Looks like some projects still need changelog files:\n` ) );
	for ( const proj of needChangelog ) {
		console.log( chalk.red( `     ${ proj }` ) );
	}
	console.log(
		chalk.red( `\nUse 'jetpack changelog add' to add changelog files for the above project(s).` )
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
	const data = spawnSync( 'git', [
		'-c',
		'core.quotepath=off',
		'diff',
		`origin/master...${ branch }`,
		`--no-renames`,
		'--name-only',
	] );

	return data.output[ 1 ].toString().trim().split( '\n' );
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

	for ( const proj of needChangelog ) {
		console.log(proj);
	}
	return projects.filter( proj => modifiedProjects.has( proj ) );
}

process.exitCode;

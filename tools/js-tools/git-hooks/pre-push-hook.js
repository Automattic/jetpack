#!/usr/bin/env node

// eslint-disable-next-line no-global-assign
require = require( 'esm' )( module /*, options*/ );
/* eslint-disable no-console, no-process-exit */
const execSync = require( 'child_process' ).execSync;
const spawnSync = require( 'child_process' ).spawnSync;
const chalk = require( 'chalk' );
const inquirer = require( 'inquirer' );
const allProjects = require( '../../cli/helpers/projectHelpers' ).allProjects;

// Initialize variables
let exitCode = 0;
let branch = getCurrentBranch();
const diffFiles = getDiffFiles();
const needChangelog = checkNeedChangelog();
console.log( chalk.green( 'Checking if changelog files are needed. Just a sec...' ) );
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
	console.log( chalk.green( 'Looks like some projects still need changelog files: ' ) );
	for ( const proj of needChangelog ) {
		console.log( proj );
	}

	// This just runs everything at once without waiting for a prompt. May have to try running the prompt in a child process?
	( async function () {
		const result = await promptForChangelog();
		console.log( result );
	} )();
}

// Get the current branch name that we're on
function getCurrentBranch() {
	return execSync( `git branch --show-current` ).toString().trim();
}

// Get list of files that this branch has touched.
function getDiffFiles() {
	return execSync( `git diff master...${ branch } --name-only` ).toString().trim().split( '\n' );
}

// Return a list of projects that this diff has touched that require a changelog.
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

// Prompt if user wants to stop the push to add any changelog files.
async function promptForChangelog() {
	const confirm = execSync(
		await inquirer.prompt( {
			type: 'confirm',
			name: 'confirm',
			message: chalk.green( 'Would you like to add required changelog files before pushing?' ),
		} )
	);
	return confirm;
}
process.exit( 1 );

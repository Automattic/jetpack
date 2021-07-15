#!/usr/bin/env node

// eslint-disable-next-line no-global-assign
require = require( 'esm' )( module /*, options*/ );
/* eslint-disable no-console, no-process-exit */
const execSync = require( 'child_process' ).execSync;
const spawnSync = require( 'child_process' ).spawnSync;
const chalk = require( 'chalk' );
const fs = require( 'fs' );
const path = require( 'path' );
const allProjects = require( '../../cli/helpers/projectHelpers' ).allProjects;

let exitCode = 0;
let branch = getCurrentBranch();
const diffFiles = getDiffFiles();
const needChangelog = checkNeedChangelog();

// Get a list of files that were just committed and total files from the diff.
// Get the current branch name that we're on
function getCurrentBranch() {
    return 	execSync(
        `git branch --show-current`
    )
    .toString()
    .trim();
}

// Get list of files that this branch has touched
function getDiffFiles() {
    return 	execSync(
        `git diff master...${branch} --name-only`
    )
    .toString()
    .trim()
    .split( '\n' );
}

// If none of the files require a changelog, bail.
function checkNeedChangelog() {
    const re = /^projects\/([^/]+\/[^/]+)\//; // regex matches project file path, ie 'project/packages/connection/..'
	for ( const file of diffFiles ) {
		const match = file.match( re );
		if ( match ) {
			return true;
		}
	}
    return false;
}

// If files require a changelog, check and see if one is included already
if ( needChangelog ) {

}
// Check just committed files
// If it contains a changelog, bail

// If there is no changelog, check the diff against master
// If the diff contains a file in the changelog folder, can assume they added a changelog file
// If there isn't, prompt for one
console.log(branch);
console.log(diffFiles);
console.log(needChangelog);
process.exit( 1 );
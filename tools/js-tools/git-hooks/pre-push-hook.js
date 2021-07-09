#!/usr/bin/env node

// eslint-disable-next-line no-global-assign
require = require( 'esm' )( module /*, options*/ );
/* eslint-disable no-console, no-process-exit */
const execSync = require( 'child_process' ).execSync;
const spawnSync = require( 'child_process' ).spawnSync;
const chalk = require( 'chalk' );
const fs = require( 'fs' );
const allProjects = require( '../../cli/helpers/projectHelpers' ).allProjects;


// Get a list of files that were just committed and total files from the diff.
    // If none of the files require a changelog, bail.
// Check just committed files
    // If it contains a changelog, bail

// If there is no changelog, check the diff against master
    // If the diff contains a file in the changelog folder, can assume they added a changelog file
    // If there isn't, prompt for one

console.log( allProjects() );
process.exit('Not yet');
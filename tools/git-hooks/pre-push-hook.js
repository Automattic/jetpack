#!/usr/bin/env node

// eslint-disable-next-line no-global-assign
require = require( 'esm' )( module /*, options*/ );
/* eslint-disable no-console, no-process-exit */
const execSync = require( 'child_process' ).execSync;
const spawnSync = require( 'child_process' ).spawnSync;
const chalk = require( 'chalk' );
const fs = require( 'fs' );
const allProjects = require( '../cli/helpers/projectHelpers' ).allProjects;
//import { allProjects, allProjectsByType } from '../cli/helpers/projectHelpers.js';

// Check the diff for files changed
// store the results in git diff --name-only
// See if any of the files changed require a changelog
// Check the diff for a changelog file
console.log( allProjects() );

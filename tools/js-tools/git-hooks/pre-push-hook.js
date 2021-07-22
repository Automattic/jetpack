#!/usr/bin/env node

/* eslint-disable no-console, no-process-exit */
const { execSync, spawnSync } = require( 'child_process' );
const chalk = require( 'chalk' );
const glob = require( 'glob' );

// Check if any touched files need a changelog file
console.log( chalk.green( 'Checking if changelog files are needed. Just a sec...' ) );
const needChangelog = checkChangelogFiles();
console.log( needChangelog );
/**
 * Parses the output of a git diff command into file paths.
 *
 * @param {string} command - Command to run. Expects output like `git diff --name-only […]`
 * @returns {Array} Paths output from git command
 */
function checkChangelogFiles() {
	const data = spawnSync( 'tools/check-changelogger-use.php', [ 'origin/master', 'HEAD' ], { stdio: 'inherit' });
	console.log(data);
}

process.exitCode = 1;
process.exitCode;

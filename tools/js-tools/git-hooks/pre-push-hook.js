#!/usr/bin/env node

/* eslint-disable no-console */
const { spawnSync } = require( 'child_process' );
const chalk = require( 'chalk' );

/**
 * Checks if changelog files are required.
 */
function checkChangelogFiles() {
	console.log( chalk.green( 'Checking if changelog files are needed. Just a sec...' ) );
	const needChangelog = spawnSync(
		'tools/check-changelogger-use.php',
		[ 'origin/master', 'HEAD' ],
		{
			stdio: 'inherit',
			cwd: __dirname + '/../../../',
		}
	);

	// If a changelog file is needed, quit the push.
	if ( needChangelog.status === 0 ) {
		console.log( chalk.green( 'Changelog check passed.' ) );
	} else {
		process.exitCode = 1;
	}
}

checkChangelogFiles();

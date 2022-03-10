#!/usr/bin/env node

/* eslint-disable no-console */
const isJetpackDraftMode = require( './jetpack-draft' );
const { spawnSync } = require( 'child_process' );
const chalk = require( 'chalk' );
const inquirer = require( 'inquirer' );

/**
 * Checks if changelog files are required.
 */
async function checkChangelogFiles() {
	console.log( chalk.green( 'Checking if changelog files are needed. Just a sec...' ) );

	// Bail if we're pushing to a release branch, like boost/branch-1.3.0
	let currentBranch = spawnSync( 'git', [ 'branch', '--show-current' ] );
	currentBranch = currentBranch.stdout.toString().trim();
	const branchReg = /.*\/branch-(\d+).(\d+)(.(\d+))?/; // match example: jetpack/branch-1.2.3
	if ( currentBranch.match( branchReg ) ) {
		console.log( chalk.green( 'Release branch detected. Skipping changelog test.' ) );
		return;
	}

	// boost/branch-1.3.0
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
	} else if ( isJetpackDraftMode() ) {
		console.log(
			chalk.yellow(
				"Allowing push because you're in draft mode. To exit draft mode, use `jetpack draft disable`"
			)
		);
	} else {
		return true;
	}
}

/**
 * Prompts for for if we want to run the changelog automatically.
 *
 * @returns {boolean} - the confirmation answer.
 */
async function promptChangelog() {
	const response = await inquirer.prompt( {
		type: 'confirm',
		name: 'confirm',
		message: 'Projects needing changelog found. Run changelogger?',
		default: true,
	} );
	return response.confirm;
}

/**
 * Run the pre-push hook.
 */
async function prePushHook() {
	const needChangelog = checkChangelogFiles();
	let autoAdd = false;

	if ( needChangelog ) {
		autoAdd = await promptChangelog();
	}

	if ( autoAdd ) {
		console.log( autoAdd );
	} else {
		process.exit = 1;
	}
}

prePushHook();

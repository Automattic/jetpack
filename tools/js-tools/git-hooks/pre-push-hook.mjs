#!/usr/bin/env node

import { spawn, spawnSync } from 'child_process';
import { createInterface } from 'node:readline';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import isJetpackDraftMode from './jetpack-draft.mjs';

/**
 * Exec a command and collect the lines.
 *
 * @param {string}   cmd     - Command.
 * @param {string[]} args    - Arguments.
 * @param {object}   options - Options.
 * @return {string[]} Lines of output.
 */
async function spawnAndReadStdout( cmd, args, options = {} ) {
	const lines = [];

	await new Promise( ( resolve, reject ) => {
		let buffer = '';

		const proc = spawn( cmd, args, {
			...options,
			stdio: [ 'ignore', 'pipe', 'inherit' ],
		} );

		proc.stdout.on( 'data', data => {
			buffer += data.toString();
			let i;
			while ( ( i = buffer.indexOf( '\n' ) ) >= 0 ) {
				lines.push( buffer.substring( 0, i ) );
				buffer = buffer.substring( i + 1 );
			}
		} );

		proc.on( 'close', code => {
			if ( buffer !== '' ) {
				lines.push( buffer );
			}
			if ( code !== 0 ) {
				reject( new Error( `Command failed with code ${ code }` ) );
			} else {
				resolve();
			}
		} );

		proc.on( 'error', err => {
			reject( err );
		} );
	} );

	return lines;
}

/**
 * Checks for filename collsisions on case-insensitive file systems.
 *
 * This is probably impossible to get 100% right due to potential locale
 * differences in filesystem case folding, but this should be most of the way there.
 */
async function checkFilenameCollisions() {
	if ( process.exitCode !== 0 ) {
		return;
	}

	console.log( chalk.green( 'Checking for filename collisions. Just a sec...' ) );

	const compare = Intl.Collator( 'und', { sensitivity: 'accent' } ).compare;

	const files = (
		await spawnAndReadStdout( 'git', [
			'-c',
			'core.quotepath=off',
			'ls-tree',
			'-rt',
			'--name-only',
			'HEAD',
		] )
	).sort( compare );

	const collisions = new Set();
	let prev = null;
	for ( const file of files ) {
		if ( prev !== null && compare( file, prev ) === 0 ) {
			collisions.add( prev );
			collisions.add( file );
		}
		prev = file;
	}

	if ( collisions.size > 0 ) {
		process.exitCode = 1;
		console.error(
			chalk.red(
				'This commit contains filenames that differ only in case! This will break things for Mac users.'
			)
		);
		console.error( '- ' + [ ...collisions ].join( '\n- ' ) );
	} else {
		console.log( chalk.green( 'No collisions detected.' ) );
	}
}

/**
 * Prompt the user for input on stdin.
 *
 * @param {string} question - The prompt text.
 * @return {Promise<string>} The user's response.
 */
function promptUser( question ) {
	const rl = createInterface( {
		input: process.stdin,
		output: process.stderr,
	} );
	return new Promise( resolve => {
		rl.question( question, answer => {
			rl.close();
			resolve( answer.trim().toLowerCase() );
		} );
	} );
}

/**
 * Print "push again" message and set exit code 75 so git retries.
 */
function pushAgain() {
	console.log(
		chalk.green(
			'\nChangelog file(s) committed! Ignore the error below and `git push` again to include them.'
		)
	);
	process.exitCode = 75;
}

/**
 * Checks if changelog files are needed and offers options to the developer.
 */
async function checkChangelogFiles() {
	if ( process.exitCode !== 0 ) {
		return;
	}

	console.log( chalk.green( 'Checking if changelog files are needed. Just a sec...' ) );

	// Skip for release branches (e.g. boost/branch-1.3.0).
	let currentBranch = spawnSync( 'git', [ 'branch', '--show-current' ] );
	currentBranch = currentBranch.stdout.toString().trim();
	if ( /.*\/branch-/.test( currentBranch ) ) {
		console.log( chalk.green( 'Release branch detected. Skipping changelog test.' ) );
		return;
	}
	if ( currentBranch === 'prerelease' ) {
		console.log( chalk.green( 'Prerelease branch detected. Skipping changelog test.' ) );
		return;
	}

	// Check if any changelog files are needed.
	const needChangelog = spawnSync(
		'tools/check-changelogger-use.php',
		[ '--maybe-merge', 'origin/trunk', 'HEAD' ],
		{
			stdio: 'inherit',
			cwd: fileURLToPath( new URL( '../../../', import.meta.url ) ),
		}
	);

	if ( needChangelog.status === 0 ) {
		console.log( chalk.green( 'Changelog check passed.' ) );
		return;
	}

	if ( needChangelog.status === 8 ) {
		pushAgain();
		return;
	}

	if ( isJetpackDraftMode() ) {
		console.log(
			chalk.yellow(
				"Allowing push because you're in draft mode. To exit draft mode, use `jetpack draft disable`."
			)
		);
		return;
	}

	// Non-TTY: warn but don't block (scripts, CI, editor integrations).
	if ( ! process.stdin.isTTY ) {
		console.log(
			chalk.yellow(
				'Changelog entries may be needed. Check the "Generate changelog entries" box in the PR to auto-generate them.'
			)
		);
		return;
	}

	// Actionable exit codes: 2 (missing), 4 (uncommitted), 6 (both), 10 (committed + still missing).
	const actionable = [ 2, 4, 6, 10 ];
	if ( ! actionable.includes( needChangelog.status ) ) {
		console.error(
			chalk.red(
				`Changelog check failed with unexpected exit code (${ needChangelog.status }). Aborting push.`
			)
		);
		process.exitCode = 1;
		return;
	}

	// Interactive prompt.
	const answer = await promptUser(
		'\n' +
			chalk.yellow( 'Changelog entries may be needed for this push.\n' ) +
			'\n' +
			'  a - Add changelog entries now (interactive)\n' +
			'  p - Push anyway (let CI auto-generate via PR checkbox)\n' +
			'  q - Abort push\n' +
			'\nWhat would you like to do? [a/p/q] '
	);

	if ( answer === 'p' ) {
		console.log(
			chalk.green(
				'Pushing without changelog entries. Check the "Generate changelog entries" box in the PR to auto-generate them.'
			)
		);
		return;
	}

	if ( answer === 'a' ) {
		const autoChangelog = spawnSync( 'pnpm', [ 'jetpack', 'changelog', 'add' ], {
			stdio: 'inherit',
		} );

		if ( autoChangelog.status === 0 ) {
			const changelogFiles = await spawnAndReadStdout( 'git', [
				'-c',
				'core.quotepath=off',
				'diff',
				'--name-only',
				'--diff-filter=A',
				'--cached',
			] );

			const filesToCommit = changelogFiles.filter( file =>
				/^projects\/[^/]+\/[^/]+\/changelog\//.test( file )
			);

			if ( filesToCommit.length > 0 ) {
				const commitFiles = spawnSync( 'git', [
					'commit',
					...filesToCommit,
					'-m',
					'Add changelog entries.',
				] );
				if ( commitFiles.status === 0 ) {
					pushAgain();
					return;
				}
			}
		}

		// If we get here, something went wrong with the interactive flow.
		process.exitCode = 1;
		return;
	}

	// q, empty, EOF, or anything else → abort.
	process.exitCode = 1;
}

process.exitCode = 0;
await checkFilenameCollisions();
await checkChangelogFiles();

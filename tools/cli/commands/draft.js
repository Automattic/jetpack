/**
 * The `jetpack draft enable|disable|new` command
 */

import child_process from 'child_process';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { chalkJetpackGreen } from '../helpers/styling.js';

/**
 * Returns the path to the .jetpack-draft file
 *
 * @returns {string} - the draft file full path
 */
function getDraftFile() {
	return path.join( process.cwd(), '.jetpack-draft' );
}

/**
 * Enable draft mode.
 *
 * @param {object} argv - The argv for the command line.
 */
export async function draftEnable( argv ) {
	try {
		if ( fs.existsSync( getDraftFile() ) ) {
			console.log( chalk.yellow( 'Draft mode is already enabled.' ) );
			return;
		}

		fs.closeSync( fs.openSync( getDraftFile(), 'w' ) );

		console.log(
			chalkJetpackGreen( 'You are now in draft mode. No nags for you, but be careful.' )
		);

		if ( argv.v ) {
			console.log( argv );
		}
	} catch ( e ) {
		console.error( chalk.red( 'Uh oh! ' + e.message ) );
		console.log( argv );
		process.exit( 1 );
	}
}

/**
 * Enable draft mode.
 *
 * @param {object} argv - The argv for the command line.
 */
export async function draftDisable( argv ) {
	try {
		if ( ! fs.existsSync( getDraftFile() ) ) {
			console.log( chalk.yellow( 'Draft mode is not enabled.' ) );
			return;
		}

		fs.unlinkSync( getDraftFile() );

		console.log(
			chalkJetpackGreen(
				'You have exited draft mode. Jetpack will now run standard pre-commit and pre-push hooks. '
			)
		);

		const preCommitAnswers = await inquirer.prompt( [
			{
				type: 'confirm',
				name: 'runPreCommit',
				default: false,
				message: 'Would you like to run pre-commit checks now?',
			},
		] );

		if ( preCommitAnswers.runPreCommit ) {
			const data = child_process.spawnSync(
				path.join( process.cwd(), '.git/hooks/pre-commit' ),
				[],
				{ shell: true, stdio: 'inherit' }
			);

			// Node.js exit code status 0 === success
			if ( data.status !== 0 ) {
				console.error( chalk.red( 'Pre-commit hook failed' ) );
			} else {
				console.log( chalkJetpackGreen( 'Pre-commit hooks complete' ) );
			}
		}

		// TODO: figure out why this is stalling out

		// const prePushAnswers = await inquirer.prompt( [
		// 	{
		// 		type: 'confirm',
		// 		name: 'runPrePush',
		// 		default: false,
		// 		message: 'Would you like to run pre-push checks now?',
		// 	},
		// ] );

		// if ( prePushAnswers.runPrePush ) {
		// 	const data = child_process.spawnSync(
		// 		path.join( process.cwd(), '.git/hooks/pre-push' ),
		// 		[],
		// 		{ shell: true, stdio: "inherit" }
		// 	);

		// 	// Node.js exit code status 0 === success
		// 	if ( data.status !== 0 ) {
		// 		console.error( chalk.red('Pre-push hook failed') );
		// 	} else {
		// 		console.log( chalkJetpackGreen( 'Pre-push hooks complete' ) );
		// 	}
		// }

		if ( argv.v ) {
			console.log( argv );
		}
	} catch ( e ) {
		console.error( chalk.red( 'Uh oh! ' + e.message ) );
		console.log( argv );
		process.exit( 1 );
	}
}

/**
 * Command definition for the generate subcommand.
 *
 * @param {object} yargs - The Yargs dependency.
 * @returns {object} Yargs with the generate commands defined.
 */
export function draftDefine( yargs ) {
	yargs.command(
		'draft <cmd>',
		'Enable and disable draft mode, which reduces strictness of pre-commit and pre-push checks',
		yarg => {
			yarg
				.command(
					'enable',
					'Enable draft mode - reduces strictness of pre-commit and pre-push checks',
					async argv => {
						await draftEnable( argv );
					}
				)
				.command(
					'disable',
					'Disable draft PR mode - regular pre-commit and pre-push checks',
					async argv => {
						await draftDisable( argv );
					}
				);
		}
	);

	return yargs;
}

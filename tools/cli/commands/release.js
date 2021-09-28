/**
 * External dependencies
 */
import chalk from 'chalk';
import child_process from 'child_process';
import fs from 'fs';
import path from 'path';
import process from 'process';
import inquirer from 'inquirer';
import simpleGit from 'simple-git';

/**
 * Internal dependencies
 */
import promptForProject from '../helpers/promptForProject';
import { chalkJetpackGreen } from '../helpers/styling';
import { normalizeProject } from '../helpers/normalizeArgv';
import { allProjects, projectTypes } from '../helpers/projectHelpers';
import { readComposerJson } from '../helpers/json';

/**
 * Command definition for the release subcommand.
 *
 * @param {object} yargs - The Yargs dependency.
 * @returns {object} Yargs with the build commands defined.
 */
export function releaseDefine( yargs ) {
	yargs.command(
		'release [project] [beta, b] [script]',
		'Runs a release script for a project.',
		yarg => {
			yarg
				.positional( 'project', {
					describe:
						'Project in the form of type/name, e.g. plugins/jetpack, or type, e.g. plugins.',
					type: 'string',
				} )
				.positional( 'script', {
					alias: 's',
					describe: 'The release script to run',
					type: 'string',
				} )
				.option( 'beta', {
					alias: 'b',
					describe: 'Is this a beta?',
					type: 'boolean',
					default: false,
				} );
		},
		async argv => {
			await releaseCli( argv );
			if ( argv.v ) {
				console.log( argv );
			}
		}
	);

	return yargs;
}

/**
 * Handles the release command.
 *
 * @param {object} argv - the arguments passed.
 */
export async function releaseCli( argv ) {
	if ( argv.project ) {
		argv = await parseProj( argv );
	} else {
		argv = await promptForProject( argv );
	}

    if ( ! argv.beta ){
        argv = await promptBeta( argv );
    }
	/*
	if ( argv.script ) {
		await parseScript( argv );
	} else {
		await promptForScript( argv );
	}
*/

	console.log( argv );
}

/**
 * Checks the project we're releasing.
 *
 * @param {object} argv the arguments passed 
 * @returns argv 
 */
export async function parseProj( argv ) {
	// If we're passing a specific project
	const allProj = allProjects();
	for ( const proj of allProj ) {
		if ( argv.project === proj ) {
			return argv;
		}
	}

	console.log( chalk.red( 'Invalid project type, defaulting to interactive mode' ) );
	delete argv.project;
	argv = await promptForProject( argv );
	return argv;
}

/**
 * Checks the project we're releasing.
 *
 * @param {object} argv the arguments passed 
 * @returns argv 
 */
 export async function promptBeta( argv ) {
    const response = await inquirer.prompt( [
		{
			type: 'confirm',
			name: 'beta',
			message: `Are you releasing a beta version of ${argv.project}`,
            default: false,
		},
	] );
	argv.beta = response.beta;
    argv.b = response.beta;
	return argv;
}


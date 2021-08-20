/**
 * External dependencies
 */
import chalk from 'chalk';
import inquirer from 'inquirer';
import child_process from 'child_process';

/**
 * Internal dependencies
 */
import promptForProject, { promptForType } from '../helpers/promptForProject';
import { normalizeCleanArgv } from '../helpers/normalizeArgv';
import { allProjects } from '../helpers/projectHelpers';
import fs from 'fs';
import { runInThisContext } from 'vm';

/**
 * Command definition for the test subcommand.
 *
 * @param {object} yargs - The Yargs dependency.
 * @returns {object} Yargs with the build commands defined.
 */
export function testDefine( yargs ) {
	yargs.command(
		'test [project] [test]',
		'Runs tests for a specific project.',
		yarg => {
			yarg
				.positional( 'project', {
					describe:
						'Project in the form of type/name, e.g. plugins/jetpack, or type, e.g. plugins.',
					type: 'string',
				} )
				.positional( 'test', {
					alias: 't',
					describe: 'The test to run',
					type: 'Array',
					choices: [ 'js', 'php', 'e2e' ],
				} );
		},
		async argv => {
			await testCli( argv );
			if ( argv.v ) {
				console.log( argv );
			}
		}
	);

	return yargs;
}

/**
 * Runs the test command
 *
 * @param {Obj} argv
 */
async function testCli( argv ) {
	// Handle choosing a project.
	if ( ! argv.project || argv.project === '' ) {
		argv = await promptForProject( argv );
	}
	argv = await validateProject( argv );

	// Handle choosing a test type.
	if ( ! argv.test || argv.test === '' ) {
		argv = await promptForTest( argv );
	}

	// run the test.
	runTest( argv );
}

/**
 * Validate the project we're being passed.
 *
 * @param {Obj} argv 
 */
async function validateProject( argv ) {
	if ( allProjects().includes( argv.project ) ) {
		return;
	}
	console.log( 'Invalid project. Reverting to interactive mode' );
	argv.project = '';
	argv = await promptForProject( argv );
	return argv;
}

/**
 * Runs the actual test script for the specific project.
 *
 * @param {Obj} argv
 */
async function runTest( argv ) {
	console.log( argv );
}

/**
 * Prompts for the test we want to run.
 *
 * @param {argv}  argv - the arguments passed.
 * @returns {object} argv
 */
export async function promptForTest( argv ) {
	const response = await inquirer.prompt( [
		{
			type: 'list',
			name: 'test',
			message: 'What test are you trying to run?',
			choices: [ 'js', 'php', 'e2e' ],
		},
	] );
	argv.test = response.test;
	return argv;
}

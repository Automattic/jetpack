/**
 * External dependencies
 */
import chalk from 'chalk';
import inquirer from 'inquirer';
import child_process from 'child_process';

/**
 * Internal dependencies
 */
import promptForProject from '../helpers/promptForProject';
import { readComposerJson } from '../helpers/json.js';
import { allProjects } from '../helpers/projectHelpers';

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
					choices: [ 'js', 'php', 'coverage' ],
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
 * @param {object} argv - the arguments being passed.
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

	// Get the test script for the project.
	argv.testScript = await getTestInstructions( argv );

	runTest( argv );
}

/**
 * Validate the project we're being passed.
 *
 * @param {object} argv - the arguments being passed.
 * @returns {object} argv
 */
async function validateProject( argv ) {
	if ( allProjects().includes( argv.project ) ) {
		return argv;
	}
	console.log( chalk.red( 'Invalid project. Reverting to interactive mode' ) );
	argv.project = '';
	argv = await promptForProject( argv );
	return argv;
}

/**
 * Gets the test instructions required for the project.
 *
 * @param {object} argv - the arguments passed.
 * @returns {Array} testScript - array containing test scripts.
 */
async function getTestInstructions( argv ) {
	let testScript = '';
	const composerFile = await readComposerJson( argv.project );
	if ( argv.test === 'js' && composerFile.scripts[ 'test-js' ] ) {
		testScript = 'test-js';
	}

	if ( argv.test === 'php' && composerFile.scripts[ 'test-php' ] ) {
		testScript = 'test-php';
	}

	if ( argv.test === 'coverage' && composerFile.scripts[ 'test-coverage' ] ) {
		testScript = 'test-coverage';
	}

	if ( testScript === '' ) {
		console.log(
			chalk.red( `No ${ argv.test } script located in ${ argv.project }'s composer.json file!` )
		);
		process.exit();
	}
	return testScript;
}

/**
 * Runs the test script.
 *
 * @param {object} argv - the arguments passed.
 */
async function runTest( argv ) {
	console.log( chalk.green( `Running ${ argv.testScript } tests for ${ argv.project }` ) );
	child_process.spawnSync( 'composer', [ 'run', argv.testScript ], {
		stdio: 'inherit',
		cwd: __dirname + '/../../../' + `projects/${ argv.project }`,
	} );
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
			choices: [ 'js', 'php', 'coverage' ],
		},
	] );
	argv.test = response.test;
	return argv;
}

import child_process from 'child_process';
import path from 'path';
import chalk from 'chalk';
import execa from 'execa';
import inquirer from 'inquirer';
import Listr from 'listr';
import UpdateRenderer from 'listr-update-renderer';
import VerboseRenderer from 'listr-verbose-renderer';
import { getInstallArgs, projectDir } from '../helpers/install.js';
import { readComposerJson } from '../helpers/json.js';
import { allProjects } from '../helpers/projectHelpers.js';
import promptForProject from '../helpers/promptForProject.js';

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
 * Gets list of tests available for chosen projects.
 *
 * @param {string} project - the project we want tests for..
 * @returns {object} argv.
 */
async function getTests( project ) {
	const composerJson = await readComposerJson( project );
	if ( ! composerJson.scripts ) {
		console.log( chalk.red( `No tests found in ${ project }'s composer.json file!` ) );
		process.exit( 1 );
	}

	let tests = Object.keys( composerJson.scripts ).filter( test => test.startsWith( 'test-' ) );
	tests = tests.map( test => test.substring( 5 ) );
	if ( tests.length === 0 ) {
		console.log( chalk.red( `No tests found in ${ project }'s composer.json file!` ) );
		process.exit( 1 );
	}
	return tests;
}

/**
 * Gets the test instructions required for the project.
 *
 * @param {object} argv - the arguments passed.
 * @returns {Array} testScript - array containing test scripts.
 */
async function getTestInstructions( argv ) {
	const tests = await getTests( argv.project );
	if ( tests.includes( argv.test ) ) {
		return 'test-' + argv.test;
	}

	console.log(
		chalk.red( `No test-${ argv.test } script located in ${ argv.project }'s composer.json file!` )
	);
	process.exit( 1 );
}

/**
 * Runs the test script.
 *
 * @param {object} argv - the arguments passed.
 */
async function runTest( argv ) {
	const installer = new Listr(
		[
			{
				title: `Installing pnpm dependencies`,
				task: async () =>
					execa( 'pnpm', await getInstallArgs( 'monorepo', 'pnpm', argv ), {
						cwd: process.cwd(),
						stdio: argv.v ? 'inherit' : 'ignore',
					} ),
			},
			{
				title: `Installing composer dependencies`,
				task: async () =>
					execa( 'composer', await getInstallArgs( argv.project, 'composer', argv ), {
						cwd: projectDir( argv.project ),
						stdio: argv.v ? 'inherit' : 'ignore',
					} ),
			},
		],
		{
			concurrent: ! argv.v,
			renderer: argv.v ? VerboseRenderer : UpdateRenderer,
		}
	);
	await installer.run();

	console.log( chalk.green( `Running ${ argv.testScript } tests for ${ argv.project }` ) );
	const res = child_process.spawnSync( 'composer', [ 'run', '--timeout=0', argv.testScript ], {
		stdio: 'inherit',
		cwd: path.resolve( `projects/${ argv.project }` ),
	} );
	process.exitCode = res.status;
}
/**
 * Prompts for the test we want to run.
 *
 * @param {argv}  argv - the arguments passed.
 * @returns {object} argv
 */
export async function promptForTest( argv ) {
	const tests = await getTests( argv.project );
	const response = await inquirer.prompt( [
		{
			type: 'list',
			name: 'test',
			message: 'What test are you trying to run?',
			choices: tests,
		},
	] );
	argv.test = response.test;
	return argv;
}

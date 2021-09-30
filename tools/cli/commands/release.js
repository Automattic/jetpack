/**
 * External dependencies
 */
import chalk from 'chalk';
import child_process from 'child_process';
import inquirer from 'inquirer';

/**
 * Internal dependencies
 */
import promptForProject from '../helpers/promptForProject';
import { chalkJetpackGreen } from '../helpers/styling';
import { allProjects } from '../helpers/projectHelpers';

/**
 * Command definition for the release subcommand.
 *
 * @param {object} yargs - The Yargs dependency.
 * @returns {object} Yargs with the build commands defined.
 */
export function releaseDefine( yargs ) {
	yargs.command(
		'release [project] [script]',
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
					choices: [ 'changelog', 'readme', 'release-branch', 'amend' ],
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

	if ( ! argv.beta ) {
		argv = await promptBeta( argv );
	}

	if ( ! argv.script || argv.script === '' ) {
		argv = await promptForScript( argv );
	}

	scriptRouter( argv );
	await runScript( argv );
}

/**
 * Run the script.
 *
 * @param {object} argv - the arguments passed
 */
export async function runScript( argv ) {
	console.log( chalkJetpackGreen( `Running ${ argv.script }! Just a moment...` ) );

	try {
		child_process.spawnSync( argv.script, [ ...argv.scriptArgs ], {
			stdio: 'inherit',
		} );
	} catch ( err ) {
		console.error( 'Error running script!', err );
	}

	console.log( argv.next );
}

/**
 * Determine which script to run.
 *
 * @param {object} argv - the arguments passed
 */
export async function scriptRouter( argv ) {
	const isBeta = argv.beta ? '-b' : '';
	switch ( argv.script ) {
		case 'changelog':
			argv.script = `tools/changelogger-release.sh`;
			argv.scriptArgs = [ isBeta, argv.project ];
			argv.next = `Finished! Next: \n	- Create a new branch off master, review the changes, make any necessary adjustments. \n	- Commit your changes. \n	- To continue with the release process, update the readme.txt by running:\n		jetpack release ${ argv.project } readme \n`;
			break;
		case 'readme':
		case 'release-branch':
		case 'append':
			console.log( 'Not implemented yet!' );
			break;
	}
}
/**
 * Checks the project we're releasing.
 *
 * @param {object} argv - the arguments passed
 * @returns {object} argv
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
 * @param {object} argv - the arguments passed
 * @returns {object} argv
 */
export async function promptBeta( argv ) {
	const response = await inquirer.prompt( [
		{
			type: 'confirm',
			name: 'beta',
			message: `Are you releasing a beta version of ${ argv.project }?`,
			default: false,
		},
	] );
	argv.beta = response.beta;
	argv.b = response.beta;
	return argv;
}

/**
 * Asks for what part of the release process we want to run.
 *
 * @param {object} argv - the arguments passed
 * @returns {object} argv
 */
export async function promptForScript( argv ) {
	const response = await inquirer.prompt( [
		{
			type: 'list',
			name: 'script',
			message: `What step of the release process are you looking to do for ${ argv.project }?`,
			choices: [
				{
					name: `[Create changelog.md  ] - Compile all changelog files into ${ argv.project }'s CHANGELOG.md `,
					value: 'changelog',
				},
				{
					name: `[Update readme.txt    ] - Update ${ argv.project }'s readme.txt file based on the updated changelog.`,
					value: 'readme',
				},
				{
					name: `[Create release branch] - Create a release branch for  ${ argv.project }`,
					value: 'release-branch',
				},
				{
					name: `[Amend changelog.md  ] - Updates changelog.md with any files cherry picked to release branch prior to release.`,
					value: 'amend',
				},
			],
		},
	] );
	argv.script = response.script;
	return argv;
}

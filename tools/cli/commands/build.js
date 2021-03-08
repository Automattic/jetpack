/**
 * External dependencies
 */
import chalk from 'chalk';
import Listr from 'listr';
import VerboseRenderer from 'listr-verbose-renderer';
import UpdateRenderer from 'listr-update-renderer';

/**
 * Internal dependencies
 */
import { chalkJetpackGreen } from '../helpers/styling.js';
import { promptForProject } from '../helpers/promptForProject.js';
import { readComposerJson } from '../helpers/json';
import { installProjectTask } from '../helpers/tasks/installProjectTask';
import { allProjectsByType } from '../helpers/projectHelpers';
import { normalizeBuildArgv } from '../helpers/normalizeArgv';
import { buildProjectTask } from '../helpers/tasks/buildProjectTask';
import { projectBuildCommand } from '../helpers/projectBuildCommand';

/**
 * Relays build commands to a particular project.
 *
 * @param {object} options - The argv options.
 */
async function buildRouter( options ) {
	if ( options.project ) {
		const data = readComposerJson( options.project );
		data !== false ? await build( options.project, options.production, data, options.v ) : false;
	} else {
		console.error( chalk.red( 'You did not choose a project!' ) );
	}
}

/**
 * Builds a project.
 *
 * @param {string} project - The project.
 * @param {boolean} production - If a production build should be made.
 * @param {object} composerJson - The project's composer.json file, parsed.
 * @param {boolean} verbose - If verbose output is desired.
 */
export async function build( project, production, composerJson, verbose ) {
	console.log(
		chalkJetpackGreen(
			`Hell yeah! It is time to build ${ project }!\n` +
				'Go ahead and sit back. Relax. This will take a few minutes.'
		)
	);

	const opts = {
		renderer: verbose ? VerboseRenderer : UpdateRenderer,
	};

	const builder = new Listr(
		[
			{
				title: `Building ${ project }`,
				task: () => {
					return new Listr(
						[
							installProjectTask( { project: project, v: verbose, production: production } ),
							buildProjectTask( { project: project, v: verbose, production: production } ),
						],
						opts
					);
				},
			},
		],
		opts
	);

	builder.run().catch( err => {
		console.error( err );
	} );
}

/**
 * Builds all packages.
 *
 * @param {object} options - The options passed from the command line.
 */
function buildAllPackages( options ) {
	const tasks = [];
	const opts = {
		concurrent: ! options.v,
		renderer: options.v ? VerboseRenderer : UpdateRenderer,
	};

	allProjectsByType( 'packages' ).forEach( project => {
		if ( projectBuildCommand( project, options.production ) ) {
			tasks.push( {
				title: `Building ${ project }`,
				task: () => {
					return new Listr(
						[
							installProjectTask( {
								project: project,
								v: options.v,
								production: options.production,
							} ),
							buildProjectTask( {
								project: project,
								v: options.v,
								production: options.production,
							} ),
						],
						opts
					);
				},
			} );
		}
	} );

	const builds = new Listr( tasks, opts );

	builds.run().catch( err => {
		console.error( err );
	} );
}

/**
 * Entry point for the CLI.
 *
 * @param {object} argv - The argv for the command line.
 */
export async function buildCli( argv ) {
	argv = normalizeBuildArgv( argv );

	if ( argv.project === 'packages' ) {
		buildAllPackages( argv );
		return;
	}

	argv = await promptForProject( argv );
	await buildRouter( argv );
}

/**
 * Command definition for the build subcommand.
 *
 * @param {object} yargs - The Yargs dependency.
 *
 * @returns {object} Yargs with the build commands defined.
 */
export function buildDefine( yargs ) {
	yargs.command(
		'build [project]',
		'Builds a monorepo project',
		yarg => {
			yarg
				.positional( 'project', {
					describe: 'Project in the form of type/name, e.g. plugins/jetpack',
					type: 'string',
				} )
				.option( 'production', {
					alias: 'p',
					type: 'boolean',
					description: 'Build for production.',
				} );
		},
		async argv => {
			await buildCli( argv );
			if ( argv.v ) {
				console.log( argv );
			}
		}
	);

	return yargs;
}

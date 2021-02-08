/**
 * External dependencies
 */
import chalk from 'chalk';
import path from 'path';
import execa from 'execa';
import Listr from 'listr';

/**
 * Internal dependencies
 */
import { chalkJetpackGreen } from '../helpers/styling.js';
import { promptForProject } from '../helpers/promptForProject.js';
import { readComposerJson } from '../helpers/readJson';
import { installProjectTask } from '../helpers/tasks/installProjectTask';

/**
 * Relays build commands to a particular project.
 *
 * @param {object} options - The argv options.
 */
async function buildRouter( options ) {
	options = {
		project: '',
		production: false,
		...options,
	};

	if ( options.project ) {
		const data = readComposerJson( options.project );
		data !== false ? await build( options.project, options.production, data ) : false;
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
 */
export async function build( project, production, composerJson ) {
	let command = '';

	if ( composerJson.scripts ) {
		const buildDev = composerJson.scripts[ 'build-development' ]
			? 'composer build-development'
			: null;
		const buildProd = composerJson.scripts[ 'build-production' ]
			? 'composer build-production'
			: null;
		// If production, prefer production script. If dev, prefer dev. Either case, fall back to the other if exists.
		command = production ? buildProd || buildDev : buildDev || buildProd;
	}

	if ( ! command ) {
		// If neither build step is defined, abort.
		console.warn( chalk.yellow( 'This project does not have a build step defined.' ) );
		return;
	}

	console.log(
		chalkJetpackGreen(
			`Hell yeah! It is time to build ${ project }!\n` +
				'Go ahead and sit back. Relax. This will take a few minutes.'
		)
	);

	const builder = new Listr( [
		{
			title: `Building ${ project }`,
			task: () => {
				return new Listr( [
					installProjectTask( { project: project } ),
					{
						title: `Building ${ project }`,
						task: () => execa.command( command, { cwd: path.resolve( `projects/${ project }` ) } ),
					},
				] );
			},
		},
	] );

	builder.run().catch( err => {
		console.error( err );
	} );
}

/**
 * Entry point for the CLI.
 *
 * @param {object} argv - The argv for the command line.
 */
export async function buildCli( argv ) {
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

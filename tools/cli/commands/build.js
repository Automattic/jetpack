/**
 * External dependencies
 */
import child_process from 'child_process';
import chalk from 'chalk';
import path from 'path';

/**
 * Internal dependencies
 */
import { chalkJetpackGreen } from '../helpers/styling.js';
import { promptForProject } from '../helpers/promptForProject.js';
import { readComposerJson } from '../helpers/readComposerJson';

/**
 * Relays build commands to a particular project.
 *
 * @param {object} options - The argv options.
 */
async function buildRouter( options ) {
	options = {
		...options,
		project: options.project || '',
		production: options.production || false,
	};

	if ( options.project ) {
		const data = await readComposerJson( options.project );
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
	const buildDev = composerJson.scripts[ 'build-development' ]
		? 'composer build-development'
		: null;
	const buildProd = composerJson.scripts[ 'build-production' ] ? 'composer build-production' : null;
	// If production, prefer production script. If dev, prefer dev. Either case, fall back to the other if exists.
	const command = production ? buildProd || buildDev : buildDev || buildProd;

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
	child_process.spawnSync( command, {
		cwd: path.resolve( `projects/${ project }` ),
		shell: true,
		stdio: 'inherit',
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

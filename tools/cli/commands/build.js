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
import { readPackageJson } from "../helpers/readPackageJson";

// eslint-disable-next-line no-console
const log = console.log;

/**
 * Relays build commands to a particular project.
 *
 * @param {object} options - The argv options.
 */
async function buildRouter( options ) {
	options = {
		...options,
		project: options.project || '',
		production: options.production || false
	};

	if ( options.project ) {
		const data = await readPackageJson( options.project );
		( data !== false ) ? await build( options.project, options.production, data ) : false;
	} else {
		log( chalk.red( 'You did not choose a project!' ) );
	}
}

/**
 * Builds a project.
 *
 * @param {string} project - The project.
 * @param {boolean} production - If a production build should be made.
 * @param {object} packageJson - The project's package.json file, parsed.
 */
export async function build( project, production, packageJson ) {
	if ( ! packageJson.com_jetpack ) {
		// There's no Jetpack-specific data in package.json.
		log( chalk.yellow( 'This project does not have a build step defined.' ) );
		return;
	}
	const buildDev = packageJson.com_jetpack[ 'build-dev' ];
	const buildProd = packageJson.com_jetpack[ 'build-prod' ];
	let command;

	if ( ! buildDev && ! buildProd ) {
		// If neither build step is defined, abort.
		log( chalk.yellow( 'This project does not have a build step defined!' ) );
		return;
	} else if ( production && buildProd ) {
		// If we need a production build and there is a production step, use it.
		command = buildProd;
	} else {
		// If we don't care about production OR there's only a build-dev step defined, let's do it.
		command = buildDev;
	}
	log(
		chalkJetpackGreen(
			`Hell yeah! It is time to build ${ project }!\n` +
			'Go ahead and sit back. Relax. This will take a few minutes.'
		)
	);
	child_process.spawnSync( 'yarn', [ command ], {
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
				// eslint-disable-next-line no-console
				console.log( argv );
			}
		}
	);

	return yargs;
}

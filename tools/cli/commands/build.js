/**
 * External dependencies
 */
import child_process from 'child_process';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';

/**
 * Internal dependencies
 */
import { chalkJetpackGreen } from '../helpers/styling.js';
import { promptForProject } from '../helpers/promptForProject.js';

// eslint-disable-next-line no-console
const log = console.log;

/**
 * Relays build commands to a particular project.
 *
 * @param {object} options - The argv options.
 */
async function buildRouter(options ) {
	options = {
		...options,
		project: options.project || '',
		targetDirectory: options.targetDirectory || process.cwd(),
	};

	if ( options.project ) {
		await fs.readFile( 'projects/' + options.project + '/package.json', "utf8", ( err, data ) => {
			if ( err ) {
				log( chalk.yellow( 'This project does not have a package.json file.' ) );
				return;
			}
			try {
				data = JSON.parse( data );
			} catch ( parseError ) {
				log( chalk.red( 'Could not parse package.json. Something is pretty wrong.' ), parseError );
				return;
			}
			build( options.project, data );
		} );
	} else {
		log( chalk.red( 'You did not choose a project!' ) );
	}
}

/**
 * Builds a project.
 *
 * @param {string} project - The project.
 */
export async function build( project, packageJson ) {
	const buildDev = packageJson.com_jetpack['build-dev'];
	const buildProd = packageJson.com_jetpack['build-prod'];

	if ( buildDev ) {
		log(
			chalkJetpackGreen(
				`Hell yeah! It is time to build ${project}!\n` +
				'Go ahead and sit back. Relax. This will take a few minutes.'
			)
		);
		child_process.spawnSync( 'yarn', [ buildDev ], {
			cwd: path.resolve( `projects/${project}` ),
			shell: true,
			stdio: 'inherit',
		} );
	} else {
		log( chalk.yellow( 'This project does not have a build step defined.' ) );
	}
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
			yarg.positional( 'project', {
				describe: 'Project in the form of type/name, e.g. plugins/jetpack',
				type: 'string',
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

/**
 * External dependencies
 */
import chalk from 'chalk';
import path from 'path';
import child_process from 'child_process';

/**
 * Internal dependencies
 */
import { promptForProject } from '../helpers/promptForProject';
import { readPackageJson } from '../helpers/readPackageJson';
import { chalkJetpackGreen } from '../helpers/styling';
import { allProjects } from '../helpers/projectHelpers';

// eslint-disable-next-line no-console
const log = console.log;
let output = true;

/**
 * Command definition for the build subcommand.
 *
 * @param {object} yargs - The Yargs dependency.
 *
 * @returns {object} Yargs with the build commands defined.
 */
export function watchDefine( yargs ) {
	yargs.command(
		'watch [project]',
		'Watches a monorepo project',
		yarg => {
			yarg
				.positional( 'project', {
					describe: 'Project in the form of type/name, e.g. plugins/jetpack',
					type: 'string',
				} )
				// @todo make this work. :)
				.option( 'all', {
					alias: 'a',
					type: 'boolean',
					description: 'Watch all projects [DOES NOT YET WORK]',
				} );
		},
		async argv => {
			await watchCli( argv );
			if ( argv.v ) {
				// eslint-disable-next-line no-console
				console.log( argv );
			}
		}
	);

	return yargs;
}

/**
 * Entry point for the CLI.
 *
 * @param {object} options - The argv for the command line.
 */
export async function watchCli( options ) {
	if ( options.all ) {
		output = false;
		const projects = allProjects();
		await projects.filter( async project =>
			getWatchStep( project, await readPackageJson( project, output ) )
		);
		projects.forEach( async project => watch( project, await readPackageJson( project, output ) ) );
		return;
	}

	options = await promptForProject( options );
	options = {
		...options,
		project: options.project || '',
	};

	if ( options.project ) {
		const data = await readPackageJson( options.project );
		data !== false ? await watch( options.project, data ) : false;
	} else {
		log( chalk.red( 'You did not choose a project!' ) );
	}
}

/**
 * Fires off watch command.
 *
 * @param {string} project - The project.
 * @param {object} packageJson - The project's package.json file, parsed.
 */
export async function watch( project, packageJson ) {
	const command = getWatchStep( project, packageJson );
	if ( command === false ) {
		return;
	}
	log(
		chalkJetpackGreen(
			`Hell yeah! It is time to watch ${ project }!\n` + 'Go forth and write more code.'
		)
	);
	child_process.spawnSync( command, {
		cwd: path.resolve( `projects/${ project }` ),
		shell: true,
		stdio: 'inherit',
	} );
}

/**
 * Does the project have a watch step?
 *
 * @param {string} project - The project.
 * @param {object} packageJson - The project's package.json file, parsed.
 *
 * @returns {string|boolean} If the project has a watch step, the watch command or false.
 */
function getWatchStep( project, packageJson ) {
	if ( packageJson.com_jetpack && packageJson.com_jetpack.watch ) {
		return 'yarn ' + packageJson.com_jetpack.watch;
	}

	if ( packageJson.scripts && packageJson.scripts.watch ) {
		return packageJson.scripts.watch;
	}

	// There's no Jetpack-specific data in package.json or no watch command.
	output ? log( chalk.yellow( 'This project does not have a watch step defined.' ) ) : null;
	return false;
}

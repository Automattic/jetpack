/**
 * External dependencies
 */
import chalk from 'chalk';
import path from 'path';
import child_process from 'child_process';

/**
 * Internal dependencies
 */
import promptForProject from '../helpers/promptForProject';
import { readComposerJson } from '../helpers/json';
import { chalkJetpackGreen } from '../helpers/styling';
import { allProjects } from '../helpers/projectHelpers';
import checkPropjectScriptAvailability from '../helpers/checkProjectScriptAvailability';

let output = true;

/**
 * Command definition for the build subcommand.
 *
 * @param {object} yargs - The Yargs dependency.
 * @returns {object} Yargs with the watch commands defined.
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
				.option( 'all', {
					alias: 'a',
					type: 'boolean',
					description: 'Watch all projects [BETA]',
				} );
		},
		async argv => {
			await watchCli( argv );
			if ( argv.v ) {
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
		await projects.filter( project =>
			checkPropjectScriptAvailability( project, 'watch', readComposerJson( project, output ) )
		);
		projects.forEach( project => watch( project, readComposerJson( project, output ) ) );
		return;
	}

	options = await promptForProject( options );
	options = {
		project: '',
		...options,
	};

	if ( options.project ) {
		const data = readComposerJson( options.project );
		data !== false ? await watch( options.project, data ) : false;
	} else {
		console.error( chalk.red( 'You did not choose a project!' ) );
	}
}

/**
 * Fires off watch command.
 *
 * @param {string} project - The project.
 * @param {object} packageJson - The project's package.json file, parsed.
 */
export async function watch( project, packageJson ) {
	const command = checkPropjectScriptAvailability( project, 'watch', packageJson );
	if ( command === false ) {
		return;
	}
	console.log(
		chalkJetpackGreen(
			`Hell yeah! It is time to watch ${ project }!\n` + 'Go forth and write more code.'
		)
	);
	child_process.spawnSync( 'composer', [ 'watch' ], {
		cwd: path.resolve( `projects/${ project }` ),
		shell: true,
		stdio: 'inherit',
	} );
}

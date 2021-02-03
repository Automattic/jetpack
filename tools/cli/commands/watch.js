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
import { readComposerJson } from '../helpers/readComposerJson';
import { chalkJetpackGreen } from '../helpers/styling';
import { allProjects } from '../helpers/projectHelpers';

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
		await projects.filter( async project =>
			hasWatchStep( project, await readComposerJson( project, output ) )
		);
		projects.forEach( async project =>
			watch( project, await readComposerJson( project, output ) )
		);
		return;
	}

	options = await promptForProject( options );
	options = {
		...options,
		project: options.project || '',
	};

	if ( options.project ) {
		const data = await readComposerJson( options.project );
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
	const command = hasWatchStep( project, packageJson );
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

/**
 * Does the project have a watch step?
 *
 * @param {string} project - The project.
 * @param {object} composerJson - The project's composer.json file, parsed.
 *
 * @returns {boolean} If the project has a watch step, the watch command or false.
 */
function hasWatchStep( project, composerJson ) {
	if ( composerJson.scripts && composerJson.scripts.watch ) {
		return true;
	}

	// There's no watch step defined.
	output
		? console.warn(
				chalk.yellow( 'This project does not have a watch step defined in composer.json.' )
		  )
		: null;
	return false;
}

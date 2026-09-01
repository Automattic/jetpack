import child_process from 'child_process';
import path from 'path';
import chalk from 'chalk';
import { readComposerJson } from '../helpers/json.js';
import { allProjects } from '../helpers/projectHelpers.js';
import promptForProject from '../helpers/promptForProject.js';
import { chalkJetpackGreen } from '../helpers/styling.js';

let output = true;

/**
 * Command definition for the build subcommand.
 *
 * @param {object} yargs - The Yargs dependency.
 * @return {object} Yargs with the watch commands defined.
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
				} )
				.option( 'hot', {
					type: 'boolean',
					description: 'Enable HMR (Hot Module Replacement) watch mode',
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
			hasWatchStep( project, readComposerJson( project, output ), options.hot )
		);
		projects.forEach( project =>
			watch( project, readComposerJson( project, output ), options.hot )
		);
		return;
	}

	options = await promptForProject( options );
	options = {
		project: '',
		...options,
	};

	if ( options.project ) {
		const data = readComposerJson( options.project );
		data !== false && ( await watch( options.project, data, options.hot ) );
	} else {
		console.error( chalk.red( 'You did not choose a project!' ) );
	}
}

/**
 * Fires off watch command.
 *
 * @param {string}  project      - The project.
 * @param {object}  composerJson - The project's composer.json file, parsed.
 * @param {boolean} hot          - Whether to use HMR watch mode.
 */
export async function watch( project, composerJson, hot = false ) {
	const command = hasWatchStep( project, composerJson, hot );
	if ( command === false ) {
		return;
	}

	// Determine which script to run
	let scriptName = 'watch';
	if ( hot ) {
		if ( composerJson.scripts && composerJson.scripts[ 'watch-hot' ] ) {
			scriptName = 'watch-hot';
		} else {
			console.log(
				chalk.yellow( `No watch-hot script found for ${ project }, falling back to watch.` )
			);
		}
	}

	console.log( chalkJetpackGreen( `Watching '${ project }'...\nGo write some code.` ) );
	child_process.spawnSync( 'composer', [ scriptName ], {
		cwd: path.resolve( `projects/${ project }` ),
		shell: true,
		stdio: 'inherit',
	} );
}

/**
 * Does the project have a watch step?
 *
 * @param {string}  project      - The project.
 * @param {object}  composerJson - The project's composer.json file, parsed.
 * @param {boolean} hot          - Whether to check for HMR watch mode.
 * @return {boolean} If the project has a watch step, the watch command or false.
 */
function hasWatchStep( project, composerJson, hot = false ) {
	// When hot is requested, check for watch-hot or watch (since we fall back to watch)
	if ( composerJson.scripts ) {
		if ( hot && composerJson.scripts[ 'watch-hot' ] ) {
			return true;
		}
		if ( composerJson.scripts.watch ) {
			return true;
		}
	}

	// There's no watch step defined.
	output &&
		console.warn(
			chalk.yellow( 'This project does not have a watch step defined in composer.json.' )
		);
	return false;
}

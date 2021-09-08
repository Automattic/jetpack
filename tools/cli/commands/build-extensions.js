/**
 * External dependencies
 */
import chalk from 'chalk';
import child_process from 'child_process';
import path from 'path';

/**
 * Internal dependencies
 */
import { chalkJetpackGreen } from '../helpers/styling.js';
import promptForProject from '../helpers/promptForProject.js';
import { readComposerJson } from '../helpers/json';
import checkPropjectScriptAvailability from '../helpers/checkProjectScriptAvailability.js';

/**
 * Builds extesions for the project.
 *
 * @param {string} projectName  - The name of the project.
 * @param {boolean} watchMode   - Whether or not to run in watch mode.
 * @param {object} composerJson - The project's composer.json file, parsed.
 */
export async function buildExtensions( projectName, watchMode, composerJson ) {
	console.log(
		chalkJetpackGreen(
			`Hell yeah! It is time to build extensions for ${ chalk.bold( projectName ) }!`
		)
	);

	if ( watchMode ) {
		console.log( chalkJetpackGreen( `Watch mode is enabled 👀` ) );
	}

	const composerScript = watchMode ? 'watch-extensions' : 'build-extensions';
	if ( ! ( await checkPropjectScriptAvailability( projectName, composerScript, composerJson ) ) ) {
		return;
	}

	child_process.spawnSync( 'composer', [ composerScript ], {
		cwd: path.resolve( `projects/${ projectName }` ),
		shell: true,
		stdio: 'inherit',
	} );
}

/**
 * Entry point for the CLI.
 *
 * @param {object} argv - The argv for the command line.
 */
export async function buildExtensionsCli( argv ) {
	argv = await promptForProject( argv );

	if ( argv && argv.project ) {
		const data = readComposerJson( argv.project );
		data !== false ? await buildExtensions( argv.project, argv.w, data ) : false;
	} else {
		console.error( chalk.red( 'You did not choose a project!' ) );
	}
}

/**
 * Command definition for the build-extensions subcommand.
 *
 * @param {object} yargs - The Yargs dependency.
 * @returns {object} Yargs with the build-extensions commands defined.
 */
export function buildExtensionsDefine( yargs ) {
	yargs.command(
		'build-extensions [project]',
		'Builds extesions of a monorepo project',
		yarg => {
			yarg
				.positional( 'project', {
					describe: 'Project in the form of type/name, e.g. plugins/jetpack',
					type: 'string',
				} )
				.option( 'watch', {
					alias: 'w',
					type: 'boolean',
					description: 'Build the extensions in watching mode.',
				} );
		},
		async argv => {
			await buildExtensionsCli( argv );
			if ( argv.v ) {
				console.log( argv );
			}
		}
	);

	return yargs;
}

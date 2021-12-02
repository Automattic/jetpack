/**
 * External dependencies
 */
import process from 'process';
import path from 'path';
import execa from 'execa';

/**
 * Internal dependencies
 */
import { chalkJetpackGreen } from '../styling';
import { normalizeBuildArgv } from '../normalizeArgv';
import projectBuildCommand from '../projectBuildCommand';

/**
 * Preps the task for an individual project.
 *
 * @param {object} argv - Argv object for an build command.
 * @returns {object} - The project install task per Listr format.
 */
export default function buildProjectTask( argv ) {
	argv = normalizeBuildArgv( argv );

	// This should never happen. Hard exit to avoid errors in consuming code.
	if ( ! argv.project ) {
		console.error( 'You cannot create a build task for nothing.' );
		process.exit( 1 );
	}

	const cwd = path.resolve( `projects/${ argv.project }` );
	const command = projectBuildCommand( argv.project, argv.production );
	let enabled = true;

	if ( ! command ) {
		// If neither build step is defined, abort.
		enabled = false;
	}

	return {
		title: chalkJetpackGreen( `Building ${ argv.project }` ),
		enabled: () => {
			return enabled;
		},
		task: () =>
			argv.v
				? execa.commandSync( command, { cwd: cwd, stdio: 'inherit' } )
				: execa.command( command, { cwd: cwd } ),
	};
}

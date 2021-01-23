/**
 * External dependencies
 */
import process from 'process';
import path from 'path';
import Listr from 'listr';
import execa from 'execa';

/**
 * Internal dependencies
 */
import { readComposerJson, readPackageJson } from '../readJson';
import { chalkJetpackGreen } from '../styling';

/**
 * Preps the task for an individual project.
 *
 * @param {string} project - A monorepo project.
 * @param {boolean} root - If we want to install the monorepo.
 *
 * @returns {object} - The project install task per Listr format.
 */
export function installProjectTask( project, root = false ) {
	// This should never happen. Hard exit to avoid errors in consuming code.
	if ( ! project && ! root ) {
		console.error( 'You cannot create an install task for nothing.' );
		process.exit( 1 );
	}
	const cwd = root ? process.cwd() : path.resolve( `projects/${ project }` );
	const composerEnabled = root ? true : Boolean( readComposerJson( project, false ) );
	const yarnEnabled = root ? true : Boolean( readPackageJson( project, false ) );
	project = root ? 'Monorepo' : project;

	return {
		title: `Installing ${ project }`,
		task: () => {
			return new Listr(
				[
					{
						title: chalkJetpackGreen( 'Installing Composer Dependencies' ),
						enabled: () => {
							return composerEnabled;
						},
						task: () => execa.command( 'composer install', { cwd: cwd } ),
					},
					{
						title: chalkJetpackGreen( 'Installing Yarn Dependencies' ),
						enabled: () => {
							return yarnEnabled;
						},
						task: () => execa.command( 'yarn install', { cwd: cwd } ),
					},
				],
				{ concurrent: true }
			);
		},
	};
}

/**
 * Internal dependencies
 */
import { readComposerJson } from './json';

/**
 * Returns the project build command.
 *
 * @param {string} project - Project slug.
 * @param {boolean} production - If a production build is requested.
 * @returns {string} Build command, empty if none.
 */
export default function projectBuildCommand( project, production ) {
	const composerJson = readComposerJson( project, false );
	let command = '';
	if ( composerJson.scripts ) {
		const buildDev = composerJson.scripts[ 'build-development' ]
			? 'composer build-development'
			: null;
		const buildProd = composerJson.scripts[ 'build-production' ]
			? 'composer build-production'
			: null;
		// If production, prefer production script. If dev, prefer dev. Either case, fall back to the other if exists.
		command = production ? buildProd || buildDev : buildDev || buildProd;
	}

	return command;
}

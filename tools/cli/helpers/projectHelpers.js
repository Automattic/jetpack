/**
 * External dependencies
 */
import { readdirSync } from 'fs';

export const dirs = ( source, prefix = '' ) =>
	readdirSync( source, { withFileTypes: true } )
		.filter( dirent => dirent.isDirectory() )
		.map( dirent => prefix + dirent.name );

export const projectTypes = [ 'github-actions', 'packages', 'plugins' ];
// export const projectTypes = [ 'editor-extensions', 'github-actions', 'packages', 'plugins' ], // Swap out line above once there's editor-extensions in place.

/**
 * Returns an array of all projects.
 *
 * @returns {Array} Array of all projects.
 */
export function allProjects() {
	let projects = [];
	projectTypes.forEach( type => {
		const typeProjects = dirs( './projects/' + type, type + '/' );
		projects = projects.concat( typeProjects );
	} );
	projects = Object.values( projects );
	return projects;
}

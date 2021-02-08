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
		const typeProjects = allProjectsByType( type );
		projects = projects.concat( typeProjects );
	} );
	projects = Object.values( projects );
	return projects;
}

/**
 * Returns an array of projects by the given type.
 *
 * @param {string} type - The project type. Must be one of projectTypes
 *
 * @returns {Error|Array} - Array of projects on success, error if an unknown type is passed.
 */
export function allProjectsByType( type ) {
	if ( ! projectTypes.includes( type ) ) {
		return new Error( 'Must be an accepted project type.' );
	}
	return dirs( './projects/' + type, type + '/' );
}

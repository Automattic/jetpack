import { readdirSync } from 'fs';
import chalk from 'chalk';
import pluralize from 'pluralize';

export const dirs = ( source, prefix = '' ) =>
	readdirSync( source, { withFileTypes: true } )
		.filter( dirent => dirent.isDirectory() )
		.map( dirent => prefix + dirent.name );

export const projectTypes = [ 'github-actions', 'js-packages', 'packages', 'plugins' ];
// export const projectTypes = [ 'editor-extensions', 'js-packages', 'packages', 'plugins' ], // Swap out line above once there's editor-extensions in place.

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
 * Checks if a project name already is valid to use.
 *
 * @param {string} dir - the directory we're checking.
 * @param {string} newName - the name of the new project we're checking.
 * @returns {boolean} - return true if we're newName matches an existing project name.
 */
export function checkNameValid( dir, newName ) {
	const existingNames = dirs( './projects/' + pluralize( dir ) );
	const validCharacters = new RegExp( '^[a-z0-9_.-]+$' );
	if ( newName.length === 0 ) {
		console.error( chalk.red( 'Name must have a value.' ) );
		throw new Error( 'Name must have a value' );
	}

	if ( existingNames.includes( newName ) ) {
		console.error( chalk.red( 'The name indicated is already in use.' ) );
		throw new Error( 'Duplicative name' );
	}

	if ( ! validCharacters.test( newName ) ) {
		console.error(
			chalk.red(
				'The name has invalid characters. Only alphanumeric words joined with _.- allowed.'
			)
		);
		throw new Error( 'Illegal characters' );
	}

	return true;
}

/**
 * Returns an array of projects by the given type.
 *
 * @param {string} type - The project type. Must be one of projectTypes
 * @returns {Error|Array} - Array of projects on success, error if an unknown type is passed.
 */
export function allProjectsByType( type ) {
	if ( ! projectTypes.includes( type ) ) {
		return new Error( 'Must be an accepted project type.' );
	}
	return dirs( './projects/' + type, type + '/' );
}

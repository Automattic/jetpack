/**
 * External dependencies
 */
import fs from 'fs';
import chalk from 'chalk';

// eslint-disable-next-line no-console
const log = console.log;

/**
 * Reads the package.json file and returns a parsed JS object.
 *
 * @param {string} project - The project's name.
 * @param {boolean} output - Should an information message be outputted.
 *
 * @returns {object} Package.json as a JS object.
 */
export async function readPackageJson( project, output = true ) {
	let data;
	try {
		data = fs.readFileSync( 'projects/' + project + '/package.json', 'utf8' );
	} catch ( err ) {
		output ? log( chalk.yellow( 'This project does not have a package.json file.' ) ) : null;
		return false;
	}

	try {
		data = JSON.parse( data );
		return data;
	} catch ( parseError ) {
		output
			? log( chalk.red( 'Could not parse package.json. Something is pretty wrong.' ), parseError )
			: null;
		return false;
	}
}

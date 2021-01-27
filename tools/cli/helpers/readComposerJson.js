/**
 * External dependencies
 */
import fs from 'fs';
import chalk from 'chalk';

/**
 * Reads the composer.json file and returns a parsed JS object.
 *
 * @param {string} project - The project's name.
 * @param {boolean} output - Should an information message be outputted.
 *
 * @returns {object} Package.json as a JS object.
 */
export async function readComposerJson( project, output = true ) {
	let data;
	try {
		data = fs.readFileSync( 'projects/' + project + '/composer.json', 'utf8' );
	} catch ( err ) {
		output
			? console.warn( chalk.yellow( 'This project does not have a composer.json file.' ) )
			: null;
		return false;
	}

	return parseJSON( data, output );
}

/**
 * Parses the JSON data or throws an log piece on failure.
 *
 * @param {string} data - string of JSON data.
 * @param {boolean }output - should the console output a message if it can't parse the JSON.
 *
 * @returns {boolean|object} JSON Object or false if unable to read.
 */
function parseJSON( data, output ) {
	try {
		data = JSON.parse( data );
		return data;
	} catch ( parseError ) {
		output
			? console.error(
					chalk.red( 'Could not parse composer.json. Something is pretty wrong.' ),
					parseError
			  )
			: null;
		return false;
	}
}

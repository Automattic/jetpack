/**
 * External dependencies
 */
import fs from 'fs';
import chalk from 'chalk';

// eslint-disable-next-line no-console
const log = console.log;

/**
 * Reads a JSON file and return a parsed JSON object..
 *
 * @param {string} project - The project's name.
 * @param {string} packageManager - Which package manager.
 * @param {boolean} output - Should an information message be outputted.
 *
 * @returns {object} JS object of the json data.
 */
function readJson( project, packageManager, output ) {
	const file = packageManager + '.json';
	let data;
	try {
		data = fs.readFileSync( `projects/${ project }/${ file }`, 'utf8' );
	} catch ( err ) {
		output ? log( chalk.yellow( `This project does not have a ${ file } file.` ) ) : null;
		return undefined;
	}

	return parseJSON( data, output );
}

/**
 * Reads the composer.json file and returns a parsed JS object.
 *
 * @param {string} project - The project's name.
 * @param {boolean} output - Should an information message be outputted.
 *
 * @returns {object} Composer.json as a JS object.
 */
export function readComposerJson( project, output = true ) {
	return readJson( project, 'composer', output );
}

/**
 * Reads the package.json file and returns a parsed JS object.
 *
 * @param {string} project - The project's name.
 * @param {boolean} output - Should an information message be outputted.
 *
 * @returns {object} Package.json as a JS object.
 */
export function readPackageJson( project, output = true ) {
	return readJson( project, 'package', output );
}

/**
 * Parses the JSON data or throws an log piece on failure.
 *
 * @param {string} data - string of JSON data.
 * @param {boolean }output - should the console output a message if it can't parse the JSON.
 *
 * @returns {object|undefined} JSON Object or undefined if unable to read.
 */
function parseJSON( data, output ) {
	try {
		data = JSON.parse( data );
		return data;
	} catch ( parseError ) {
		output
			? log( chalk.red( 'Could not parse JSON. Something is pretty wrong.' ), parseError )
			: null;
		return undefined;
	}
}

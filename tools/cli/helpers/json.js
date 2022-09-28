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
 * Writes a JSON file.
 *
 * @param {string} project - The project's name.
 * @param {string} packageManager - Which package manager.
 * @param {object} json - JSON to write.
 * @param {string} pkgDir - The project's directory.
 * @param {boolean} output - Should an information message be outputted.
 */
function writeJson( project, packageManager, json, pkgDir, output ) {
	const file = packageManager + '.json';

	try {
		fs.writeFileSync( pkgDir + '/' + file, createJSON( json ) );
	} catch ( err ) {
		output ? console.error( chalk.red( `Could not write the json file.` ), err ) : null;
	}
}

/**
 * Reads the composer.json file and returns a parsed JS object.
 *
 * @param {string} project - The project's name.
 * @param {boolean} output - Should an information message be outputted.
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
 * @returns {object} Package.json as a JS object.
 */
export function readPackageJson( project, output = true ) {
	return readJson( project, 'package', output );
}

/**
 * Writes the composer.json file.
 *
 * @param {string} project - The project's name.
 * @param {object} json - Object to convert.
 * @param {string} pkgDir - The project's directory.
 * @param {boolean} output - Should an information message be outputted.
 * @returns {void}
 */
export function writeComposerJson( project, json, pkgDir, output = true ) {
	return writeJson( project, 'composer', json, pkgDir, output );
}

/**
 * Writes the package.json file.
 *
 * @param {string} project - The project's name.
 * @param {object} json - Object to convert.
 * @param {string} pkgDir - The project's directory.
 * @param {boolean} output - Should an information message be outputted.
 * @returns {void}
 */
export function writePackageJson( project, json, pkgDir, output = true ) {
	return writeJson( project, 'package', json, pkgDir, output );
}

/**
 * Parses the JSON data or throws an log piece on failure.
 *
 * @param {string} data - string of JSON data.
 * @param {boolean }output - should the console output a message if it can't parse the JSON.
 * @returns {object|undefined} JSON Object or undefined if unable to read.
 */
function parseJSON( data, output = false ) {
	try {
		return JSON.parse( data );
	} catch ( parseError ) {
		output
			? log( chalk.red( 'Could not parse JSON. Something is pretty wrong.' ), parseError )
			: null;
		return undefined;
	}
}

/**
 * Stringify the JSON data or throws an log piece on failure.
 *
 * @param {object} data - data object.
 * @param {boolean} output - should the console output a message if it can't parse the JSON.
 * @returns {string|undefined} JSON string or undefined if unable to read.
 */
function createJSON( data, output = false ) {
	try {
		return JSON.stringify( data, null, 2 );
	} catch ( parseError ) {
		output
			? log( chalk.red( 'Could not stringify JSON. Something is pretty wrong.' ), parseError )
			: null;
		return undefined;
	}
}

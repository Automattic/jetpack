const child_process = require( 'node:child_process' );
const util = require( 'util' );
const shellEscape = require( 'shell-escape' );

const exec = util.promisify( child_process.exec );

/**
 * Run the given command in the test Docker instance.
 *
 * @param {...string} command - The command to run, as a series of strings which will each be escaped.
 */
async function dockerExec( ...command ) {
	const result = await exec(
		shellEscape( [ 'docker', 'exec', '-u', 'www-data', 'super-cache-e2e_wordpress_1', ...command ] )
	);

	return result.stdout;
}

/**
 * Delete any lines that match the regex from the specified file.
 *
 * @param {string} filename - The file to be filtered.
 * @param {string} regex - A regex (without / / markers) for lines to remove.
 */
async function deleteLinesFromDockerFile( filename, regex ) {
	await dockerExec( 'sed', '-i', `/^${ regex }/d`, filename );
}

/**
 * Deletes the specified file from docker.
 *
 * @param {string} filename - The file to delete.
 */
async function deleteDockerFile( filename ) {
	await dockerExec( 'rm', '-f', filename );
}

/**
 * Returns the contents of the specified file from docker.
 *
 * @param {string} filename - The file to read.
 */
async function readDockerFile( filename ) {
	return dockerExec( 'cat', filename );
}

module.exports = {
	dockerExec,
	deleteLinesFromDockerFile,
	deleteDockerFile,
	readDockerFile,
};

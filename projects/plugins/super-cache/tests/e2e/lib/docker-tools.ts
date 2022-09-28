import { exec } from './system-tools';

/**
 * Run the given command in the test Docker instance.
 *
 * @param {...string} command - The command to run, as a series of strings which will each be escaped.
 */
export async function dockerExec( ...command: string[] ) {
	const result = await exec(
		'docker',
		'exec',
		'-u',
		'www-data',
		'super-cache-e2e_wordpress_1',
		...command
	);

	return result.stdout;
}

/**
 * Delete any lines that match the regex from the specified file.
 *
 * @param {string} filename - The file to be filtered.
 * @param {string} regex - A regex (without / / markers) for lines to remove.
 */
export async function deleteLinesFromDockerFile( filename: string, regex: string ) {
	await dockerExec( 'sed', '-i', `/^${ regex }/d`, filename );
}

/**
 * Deletes the specified file from docker.
 *
 * @param {string} filename - The file to delete.
 */
export async function deleteDockerFile( filename: string ) {
	await dockerExec( 'rm', '-f', filename );
}

/**
 * Returns the contents of the specified file from docker.
 *
 * @param {string} filename - The file to read.
 */
export async function readDockerFile( filename: string ) {
	return dockerExec( 'cat', filename );
}

/**
 * Writes the specified contents to the specified file in docker.
 *
 * @param {string} filename - The file to write.
 * @param {Buffer} data - The file data to write.
 */
export async function writeDockerFile( filename: string, data: Buffer ) {
	await dockerExec(
		'bash',
		'-c',
		`echo '${ data.toString( 'base64' ) }' | base64 --decode > ${ filename }`
	);
}

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
 * @param {string} regex    - A regex (without / / markers) for lines to remove.
 */
export async function deleteLinesFromContainerFile( filename: string, regex: string ) {
	await dockerExec( 'sed', '-i', `/${ regex }/d`, filename );
}

/**
 * Deletes the specified file from docker.
 *
 * @param {string} filename - The file to delete.
 */
export async function deleteContainerFile( filename: string ) {
	await dockerExec( 'rm', '-f', filename );
}

/**
 * Deletes the specified directory (and its contents) from docker.
 *
 * @param {string} filename - The file to delete.
 */
export async function deleteContainerDirectory( filename: string ) {
	await dockerExec( 'rm', '-rf', filename );
}

/**
 * Returns the contents of the specified file from docker.
 *
 * @param {string} filename - The file to read.
 */
export async function readContainerFile( filename: string ): Promise< Buffer > {
	const encoded = await dockerExec( 'bash', '-c', `cat ${ filename } | base64 -w 0` );

	return Buffer.from( encoded, 'base64' );
}

/**
 * Returns the contents of the specified file from docker, converted to string.
 *
 * @param {string} filename - The file to read.
 * @param          encoding
 */
export async function decodeContainerFile(
	filename: string,
	encoding: BufferEncoding = 'utf8'
): Promise< string > {
	return ( await readContainerFile( filename ) ).toString( encoding );
}

/**
 * Writes the specified contents to the specified file in docker.
 *
 * @param {string}          filename - The file to write.
 * @param {Buffer | string} data     - The file data to write.
 */
export async function writeContainerFile( filename: string, data: Buffer | string ) {
	const buffer = data instanceof Buffer ? data : Buffer.from( data );

	await dockerExec(
		'bash',
		'-c',
		`echo '${ buffer.toString( 'base64' ) }' | base64 --decode > ${ filename }`
	);
}
function shellEscape( arg0: string, filename: string, arg2: string, arg3: string ): string {
	throw new Error( 'Function not implemented.' );
}

import path from 'path';
/**
 * Formats a given file name by replacing unaccepted characters (e.g. space)
 *
 * @param {string}  filePath         - the file path. can be absolute file path, file name only, with or without extension
 * @param {boolean} includeTimestamp - if true, the current timestamp will be added as a prefix
 * @return {string} the formatted file path
 */
export function fileNameFormatter( filePath, includeTimestamp = true ) {
	const parts = path.parse( path.normalize( filePath ) );
	let fileName = parts.name;
	const ext = parts.ext;
	const dirname = parts.dir;

	if ( includeTimestamp ) {
		fileName = `${ Date.now() }_${ fileName }`;
	}

	fileName = fileName.replace( /\W/g, '_' );

	return path.join( dirname, `${ fileName }${ ext }` );
}

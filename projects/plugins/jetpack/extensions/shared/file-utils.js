
/**
 * Return the file extension according to the file name.
 *
 * @param {string} filename - file full name.
 * @returns {string} File extension.
 */
export function pickExtensionFromFileName( filename ) {
	return `.${ filename.substr( filename.lastIndexOf( '.' ) + 1 ) }`;
}

/**
 * Usage:
 *
 * eslint -f ./bin/eslint-only-filenames-formatter [opts] [filenames]
 */

module.exports = function( results ) {
	return results
		.filter( result => result.messages.length > 0 )
		.map( result => result.filePath.replace( process.cwd() + '/', '' ) )
		.join( '\n' );
};

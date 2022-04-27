const fs = require( 'fs' );

const { resolve } = require( './webpack' );

/**
 * Check if a module exists as per the webpack config.
 *
 * Path can be passed with or without file extension. If the path is passed without extension
 * it will try to find the module with any of the extensions set in webpack config
 *
 * @param {string} modulePath - Path with or without file extension
 * @returns {boolean} - Whether the module exists
 */
const moduleExists = modulePath => {
	return (
		// If the file already exists, it may already have file extension set
		fs.existsSync( modulePath ) ||
		// otherwise check the file with all the allowed file extensions
		resolve.extensions.some( ext => fs.existsSync( `${ modulePath }${ ext }` ) )
	);
};

module.exports = {
	moduleExists,
};

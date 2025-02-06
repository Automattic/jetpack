const fs = require( 'fs' );

// Figure out data directory.
const dataDirectory = fs.realpathSync( __dirname + '/../data/' );
const dataUrl = 'file://' + dataDirectory;

module.exports = {
	dataDirectory,
	dataUrl,
};

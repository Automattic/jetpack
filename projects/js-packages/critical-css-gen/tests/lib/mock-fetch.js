const fs = require( 'fs' );
const { dataDirectory } = require( './data-directory' );

/**
 * Mocked out version of node-fetch; allows fetching local resources from the data directory.
 *
 * @param {string} url - to fetch.
 */
const mockFetch = async url => {
	return new Promise( ( resolve, reject ) => {
		const localPath = fs.realpathSync( url.substring( 7 ) );
		if ( ! localPath.startsWith( dataDirectory ) ) {
			throw new Error( 'Invalid URL: ' + url );
		}

		fs.readFile( localPath, ( err, data ) => {
			if ( err ) {
				reject( err );
				return;
			}

			resolve( {
				ok: true,
				text: async () => data.toString(),
			} );
		} );
	} );
};

module.exports = mockFetch;

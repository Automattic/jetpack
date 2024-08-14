const fs = require( 'fs' );
const { dataDirectory } = require( './data-directory.js' );

/**
 * Mocked out version of node-fetch; allows fetching local resources from the data directory.
 *
 * @param {string} url - to fetch.
 * @return {Promise<Object>} - A Promise that resolves to an object with 'ok' and 'text' properties.
 */
const mockFetch = async url => {
	return new Promise( ( resolve, reject ) => {
		const pathname = new URL( url ).pathname;
		const domain = new URL( url ).toString().replace( pathname, '' );
		const localPath = url.replace( domain, dataDirectory );

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

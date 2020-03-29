/**
 * External dependencies
 */
import { noop } from 'lodash';

/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';

/**
 * Test if a URL is accessible and respond with status code < 400.
 *
 * @example
 * const [ isResolvingUrl, setIsResolvingUrl ] = useState();
 * testEmbedUrl( url, setIsResolvingUrl )
 *   .then( () => setAttributes( url ) )
 *   .catch( () => setErrorNotice() );
 *
 * @param {String} url The URL to test.
 * @param {Function} [setIsResolvingUrl=noop] An optional function to track the resolving state. Typically used to update the calling component's state.
 * @returns {Promise} Resolve if the URL is valid, reject otherwise.
 */
export default function testEmbedUrl( url, setIsResolvingUrl = noop ) {
	setIsResolvingUrl( true );
	return new Promise( async ( resolve, reject ) => {
		try {
			const response = await apiFetch( { path: `/wpcom/v2/resolve-redirect/${ url }` } );
			setIsResolvingUrl( false );
			const responseStatusCode = response.status ? parseInt( response.status, 10 ) : null;
			if ( responseStatusCode && responseStatusCode >= 400 ) {
				reject();
			} else {
				resolve();
			}
		} catch ( error ) {
			setIsResolvingUrl( false );
			reject();
		}
	} );
}

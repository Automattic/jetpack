import apiFetch from '@wordpress/api-fetch';
import { noop } from 'lodash';

/**
 * Test if a URL is accessible and respond with status code < 400.
 *
 * @example
 * const Test = props => {
 *   const [ isResolvingUrl, setIsResolvingUrl ] = useState();
 *   testEmbedUrl( url, setIsResolvingUrl )
 *     .then( () => setAttributes( url ) )
 *     .catch( () => setErrorNotice() );
 * };
 * @param {string} url - The URL to test.
 * @param {Function} [setIsResolvingUrl=noop] - An optional function to track the resolving state. Typically used to update the calling component's state.
 * @returns {Promise} Resolve if the URL is valid, reject otherwise.
 */
export default function testEmbedUrl( url, setIsResolvingUrl = noop ) {
	setIsResolvingUrl( true );

	return new Promise( ( resolve, reject ) => {
		apiFetch( { path: `/wpcom/v2/resolve-redirect/?url=${ encodeURIComponent( url ) }` } ).then(
			response => {
				setIsResolvingUrl( false );
				const responseStatusCode = response.status ? parseInt( response.status, 10 ) : null;
				if ( responseStatusCode && responseStatusCode >= 400 ) {
					reject();
				} else {
					resolve( response.url || url );
				}
			},
			() => {
				setIsResolvingUrl( false );
				reject();
			}
		);
	} );
}

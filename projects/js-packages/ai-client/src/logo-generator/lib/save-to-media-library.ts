/**
 * External dependencies
 */
import wpcomLimitedRequest from './wpcom-limited-request.js';
/**
 * Types
 */
import type { SaveToMediaLibraryProps, SaveToMediaLibraryResponseProps } from '../types.js';

/**
 *
 * @param root0
 * @param root0.siteId
 * @param root0.url
 * @param root0.attrs
 */
export async function saveToMediaLibrary( { siteId, url, attrs = {} }: SaveToMediaLibraryProps ) {
	const body = {
		media_urls: [ url ],
		attrs: [ attrs ],
	};

	const response = await wpcomLimitedRequest< SaveToMediaLibraryResponseProps >( {
		path: `/sites/${ String( siteId ) }/media/new`,
		apiVersion: '1.1',
		body,
		method: 'POST',
	} );

	return response.media[ 0 ];
}

import { isSimpleSite } from '@automattic/jetpack-script-data';
import apiFetch from '@wordpress/api-fetch';
import { rejectBodyError, toFetchOptions, toWpcomApiError } from './wpcom-request';
import type { WpcomRequest } from './wpcom-request';

/**
 * Call a WordPress.com endpoint for this site, as the current user, on any host.
 *
 * @param  request - The request.
 * @return The response body.
 * @throws {WpcomApiError} For every failure, whether an error status or an error under a success status.
 */
export async function wpcomFetch< T >( request: WpcomRequest ): Promise< T > {
	let body: T;
	try {
		body = await apiFetch< T >( toFetchOptions( request, isSimpleSite() ) );
	} catch ( error ) {
		throw toWpcomApiError( error );
	}

	return rejectBodyError( body );
}

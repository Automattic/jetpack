import { isSimpleSite } from '@automattic/jetpack-script-data';
import apiFetch from '@wordpress/api-fetch';
import { rejectBodyError, toFetchOptions } from './wpcom-request';
import type { WpcomRequest } from './wpcom-request';

/**
 * Call a WordPress.com endpoint for this site, as the current user, on any host.
 *
 * @param request - The request.
 * @return The response body.
 */
export async function wpcomFetch< T >( request: WpcomRequest ): Promise< T > {
	return rejectBodyError( await apiFetch< T >( toFetchOptions( request, isSimpleSite() ) ) );
}

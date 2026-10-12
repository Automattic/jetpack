import apiFetch from '@wordpress/api-fetch';
import { getInitialState } from './state.ts';
import { rejectBodyError, toFetchOptions } from './wpcom-request.ts';
import type { WpcomRequest } from './wpcom-request.ts';
import type { APIFetchOptions } from '@wordpress/api-fetch';

/**
 * Call a WordPress.com endpoint on behalf of the page, on either platform.
 *
 * @param request - The request.
 * @return The response body.
 */
export async function earnFetch< T >( request: WpcomRequest ): Promise< T > {
	const options = toFetchOptions( request, getInitialState().isAtomic );

	return rejectBodyError( await apiFetch< T >( options as APIFetchOptions< true > ) );
}

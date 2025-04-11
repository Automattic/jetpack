/**
 * External dependencies
 */
import apiFetch from '../../api-fetch/index.ts';
/**
 * Types
 */
import type { CheckMediaProps } from '../types.ts';

/**
 * Uses the media information to confirm it exists or not on the server.
 *
 * @param {CheckMediaProps}         checkMediaProps         - the media details to check
 * @param {CheckMediaProps.mediaId} checkMediaProps.mediaId - the id of the media to check
 * @return {Promise<boolean>} - true if the media exists, false otherwise
 */
export async function mediaExists( { mediaId }: CheckMediaProps ): Promise< boolean > {
	const id = Number( mediaId );

	if ( Number.isNaN( id ) ) {
		return false;
	}

	try {
		// Using apiFetch directly here because we don't want to limit the number of concurrent media checks
		// We store at most 10 logos in the local storage, so the number of concurrent requests should be limited
		await apiFetch( {
			path: `/wp/v2/media/${ Number( mediaId ) }`,
			method: 'GET',
		} );

		return true;
	} catch ( error ) {
		const status = ( error as { data?: { status?: number } } )?.data?.status;

		if ( status === 404 ) {
			return false;
		}

		throw error;
	}
}

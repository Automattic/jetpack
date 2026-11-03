import { DataSyncError } from '@automattic/jetpack-react-data-sync-client';

/**
 * Whether a failed data-sync request was rejected because the login cookie no longer matches the REST nonce.
 *
 * @param error - The error thrown by a data-sync request.
 */
export async function isExpiredSessionError( error: unknown ): Promise< boolean > {
	if ( ! ( error instanceof DataSyncError ) || error.errorData.status !== 'response_not_ok' ) {
		return false;
	}

	// For a response_not_ok error, data is the unread fetch Response.
	const response = error.errorData.data as Response;
	if ( response?.status !== 403 ) {
		return false;
	}

	try {
		const body = await response.clone().json();
		return body?.code === 'rest_cookie_invalid_nonce';
	} catch {
		return false;
	}
}

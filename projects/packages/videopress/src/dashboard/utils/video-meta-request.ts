import apiFetch from '@wordpress/api-fetch';

export const VIDEO_META_PATH = '/wpcom/v2/videopress/meta';

export type VideoMetaRequestData = { id: number } & Record< string, unknown >;

type MetaResponse = { code?: unknown; message?: unknown; data?: unknown } | null | undefined;

/**
 * A metadata save the server did not acknowledge, with its REST error code and HTTP status.
 */
export class VideoMetaSaveError extends Error {
	code: string;
	status?: number;

	/**
	 * Create the error.
	 *
	 * @param message - Reason for the failure, from the server when it sent one.
	 * @param code    - The REST error code, or a local code when none was sent.
	 * @param status  - The HTTP status, when the error body reports it.
	 */
	constructor( message: string, code: string, status?: number ) {
		super( message );
		this.name = 'VideoMetaSaveError';
		this.code = code;
		this.status = status;
	}
}

/**
 * Read the HTTP status from a REST error's `data`: `{ status }`, or a bare number from wpcom.
 *
 * @param data - The `data` member of a REST error body.
 * @return The status, or undefined when the error does not carry one.
 */
function statusFrom( data: unknown ): number | undefined {
	if ( typeof data === 'number' ) {
		return data;
	}
	const status = ( data as { status?: unknown } | null )?.status;
	return typeof status === 'number' ? status : undefined;
}

/**
 * Normalise an apiFetch rejection or an unacknowledged body into a VideoMetaSaveError.
 *
 * @param reason - The rejection reason or response body.
 * @return A VideoMetaSaveError with the best code, status and message known.
 */
export function toVideoMetaSaveError( reason: unknown ): VideoMetaSaveError {
	if ( reason instanceof VideoMetaSaveError ) {
		return reason;
	}
	const body = ( reason ?? {} ) as { code?: unknown; message?: unknown; data?: unknown };
	const code = typeof body.code === 'string' && body.code ? body.code : 'unknown_error';
	const message =
		typeof body.message === 'string' && body.message
			? body.message
			: 'The server did not confirm the save.';
	return new VideoMetaSaveError( message, code, statusFrom( body.data ) );
}

/**
 * Log a failed save with its status and code, which the UI does not show.
 *
 * @param id    - The attachment id the save targeted.
 * @param error - The normalised failure.
 * @return The same error, for `throw`.
 */
function logFailure( id: number, error: VideoMetaSaveError ): VideoMetaSaveError {
	// eslint-disable-next-line no-console
	console.error( 'VideoPress: video details were not saved.', {
		id,
		status: error.status,
		code: error.code,
		message: error.message,
	} );
	return error;
}

/**
 * POST a metadata update and require the endpoint's `{ code: 'success' }` acknowledgment.
 *
 * A 2xx with any other body (a redirect onto another route, a cache, an error sent as 200)
 * did not store the change, so it rejects like a failed request.
 *
 * @param  data - The request body: the attachment `id` plus API-shaped fields.
 * @return The acknowledgment body.
 * @throws {VideoMetaSaveError} When the request fails or is not acknowledged.
 */
export async function postVideoMeta( data: VideoMetaRequestData ): Promise< MetaResponse > {
	let response: MetaResponse;
	try {
		response = await apiFetch< MetaResponse >( { path: VIDEO_META_PATH, method: 'POST', data } );
	} catch ( reason ) {
		throw logFailure( data.id, toVideoMetaSaveError( reason ) );
	}
	if ( response?.code !== 'success' ) {
		const code =
			typeof response?.code === 'string' && response.code ? response.code : 'unacknowledged';
		throw logFailure( data.id, toVideoMetaSaveError( { ...( response ?? {} ), code } ) );
	}
	return response;
}

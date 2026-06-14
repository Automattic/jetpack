/**
 * Envelope-normalizing `apiFetch` wrapper, ported from the Create AI Podcast
 * admin page (src/admin-pages/create-ai-podcast/index.js).
 *
 * On wpcom Simple sites, apiFetch appends `_envelope=1` to `/wpcom/v2/` requests
 * and the wpcom-proxy middleware can return the payload wrapped in either a WP
 * REST envelope (`{ body, status, headers }`) or a wpcom JSON API envelope
 * (`{ body, code, headers }`) — sometimes as a plain object that ignores
 * `parse: false`, sometimes spread on top of a pseudo-`Response`. This wrapper
 * unwraps all of those shapes so callers always see the inner payload for 2xx
 * and a thrown `Error` (with a user-safe `.message`) for non-2xx.
 */
import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';

interface ApiError extends Error {
	code?: string;
	data?: { status: number | null; [ key: string ]: unknown };
}

interface Envelope {
	body: unknown;
	headers: unknown;
	code?: number;
	status?: number;
}

/**
 * Normalize a failed response into an Error whose `.message` is safe to surface.
 *
 * @param status - HTTP status code, or null when no response reached us.
 * @param body   - Parsed response body, or null if the response wasn't JSON.
 * @param cause  - Optional underlying error to attach as `Error.cause`.
 */
function normalizeApiError( status: number | null, body: unknown, cause?: unknown ): ApiError {
	const isRateLimited = status === 429;

	if (
		body &&
		typeof body === 'object' &&
		typeof ( body as { message?: unknown } ).message === 'string' &&
		( body as { message: string } ).message !== ''
	) {
		const b = body as { message: string; code?: string; data?: unknown };
		const extraData =
			b.data && typeof b.data === 'object' && ! Array.isArray( b.data )
				? ( b.data as Record< string, unknown > )
				: {};
		const err: ApiError = new Error( b.message );
		err.code = b.code || ( isRateLimited ? 'rate_limited' : 'unexpected' );
		err.data = { status, ...extraData };
		return err;
	}

	const rateLimitedMessage = __(
		"You've used all your audio generation credits.",
		'jetpack-podcast'
	);
	const unexpectedMessage = __( 'An unexpected error occurred.', 'jetpack-podcast' );
	const err: ApiError = new Error( isRateLimited ? rateLimitedMessage : unexpectedMessage );
	err.code = isRateLimited ? 'rate_limited' : 'unexpected';
	err.data = { status };
	if ( cause ) {
		err.cause = cause;
	}
	return err;
}

/**
 * Returns the value if it looks like a `_envelope=1` response wrapper, else null.
 *
 * @param value - Candidate envelope.
 */
function asEnvelope( value: unknown ): Envelope | null {
	if (
		value &&
		typeof value === 'object' &&
		typeof ( value as { text?: unknown } ).text !== 'function' &&
		'body' in value &&
		'headers' in value &&
		( 'code' in value || 'status' in value )
	) {
		return value as Envelope;
	}
	return null;
}

/**
 * The HTTP status from an envelope: wpcom JSON API uses `code`, WP REST `status`.
 *
 * @param envelope - The envelope to read.
 */
function envelopeCode( envelope: Envelope ): number {
	return typeof envelope.code === 'number' ? envelope.code : ( envelope.status as number );
}

/**
 * If `value` is a `{ body, ... }` envelope, return `body`; else return `value`.
 *
 * @param value - Candidate envelope.
 */
function unwrapEnvelope( value: unknown ): unknown {
	const envelope = asEnvelope( value );
	return envelope ? envelope.body : value;
}

/**
 * Best-effort JSON read used only on the error path: returns null for empty or
 * non-JSON bodies (e.g. edge rate-limit HTML pages).
 *
 * @param response      - A `Response`-like object.
 * @param response.json
 * @param response.text
 */
async function readJsonBodyOrNull( response: {
	json?: () => Promise< unknown >;
	text?: () => Promise< string >;
} ): Promise< unknown > {
	if ( response && typeof response.json === 'function' ) {
		try {
			return await response.json();
		} catch {
			return null;
		}
	}
	if ( response && typeof response.text === 'function' ) {
		const text = await response.text().catch( () => '' );
		try {
			return text ? JSON.parse( text ) : null;
		} catch {
			return null;
		}
	}
	return null;
}

/**
 * Issue an apiFetch and normalize the response into either the JSON body (2xx)
 * or a thrown Error (non-2xx / non-JSON).
 *
 * @param opts - apiFetch options ({ path, method, data }).
 */
export default async function apiCall< T = unknown >(
	opts: Record< string, unknown >
): Promise< T > {
	let response: unknown;
	try {
		response = await apiFetch( { ...opts, parse: false } as Parameters< typeof apiFetch >[ 0 ] );
	} catch ( err ) {
		const e = err as { status?: number; text?: () => Promise< string > };
		if ( e && typeof e.status === 'number' && typeof e.text === 'function' ) {
			throw normalizeApiError( e.status, unwrapEnvelope( await readJsonBodyOrNull( e ) ) );
		}
		throw normalizeApiError( null, null, err );
	}

	const envelope = asEnvelope( response );
	if ( envelope ) {
		const httpCode = envelopeCode( envelope );
		if ( httpCode < 200 || httpCode >= 300 ) {
			throw normalizeApiError( httpCode, envelope.body );
		}
		return envelope.body as T;
	}

	const r = response as { json?: () => Promise< unknown >; status?: number };
	if ( r && typeof r.json === 'function' && typeof r.status === 'number' ) {
		const httpStatus = r.status;
		if ( httpStatus === 204 ) {
			return null as T;
		}
		let body: unknown;
		try {
			body = await r.json();
		} catch {
			throw normalizeApiError( httpStatus, null );
		}
		const innerEnvelope = asEnvelope( body );
		if ( innerEnvelope ) {
			const httpCode = envelopeCode( innerEnvelope );
			if ( httpCode < 200 || httpCode >= 300 ) {
				throw normalizeApiError( httpCode, innerEnvelope.body );
			}
			return innerEnvelope.body as T;
		}
		if ( httpStatus < 200 || httpStatus >= 300 ) {
			throw normalizeApiError( httpStatus, body );
		}
		return body as T;
	}

	return response as T;
}

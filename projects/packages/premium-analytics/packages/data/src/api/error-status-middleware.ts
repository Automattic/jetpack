/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';
import type { APIFetchMiddleware } from '@wordpress/api-fetch';

/**
 * apiFetch's own parse step throws the parsed JSON body and drops the `Response`,
 * so the HTTP status is lost. Most Premium Analytics failures are WPCOM
 * pass-throughs shaped `{ error, message }` with no status in the body, which
 * leaves the data layer unable to tell a 401 from a 502. This middleware takes
 * over parsing to keep the status on the thrown error.
 *
 * The parse semantics below intentionally mirror `parseResponseAndNormalizeError`
 * / `parseAndThrowError` in `@wordpress/api-fetch`.
 */

async function parseJsonAndNormalizeError( response: Response ): Promise< unknown > {
	try {
		return await response.json();
	} catch {
		// Same shape apiFetch throws. The string is core's — translating it under
		// this package's domain would hand non-English users a different message
		// for the identical failure, so it stays on the `default` domain.
		throw {
			code: 'invalid_json',
			// eslint-disable-next-line @wordpress/i18n-text-domain
			message: __( 'The response is not a valid JSON response.', 'default' ),
		};
	}
}

function isPlainErrorBody( body: unknown ): body is Record< string, unknown > {
	return typeof body === 'object' && body !== null && ! Array.isArray( body );
}

/**
 * Turn a rejected error `Response` into the thrown error the caller expects,
 * with the HTTP status attached.
 *
 * The body of a gateway failure (502/503/504) is often HTML or plain text, so
 * parsing can itself fail. Either way the status must survive: it is what the
 * server-error UI and the retry guard key off. On a parse failure we keep
 * apiFetch's own `invalid_json` shape and still attach the status.
 */
async function normalizeErrorResponse( response: Response ): Promise< unknown > {
	const { status } = response;

	let body: unknown;
	try {
		body = await parseJsonAndNormalizeError( response );
	} catch ( parseError ) {
		body = parseError;
	}

	// Our own `WP_Error` responses carry `data.status`; adding a top-level
	// `status` is fine, but never overwrite one the body already provides.
	if ( isPlainErrorBody( body ) && ! ( 'status' in body ) ) {
		return { ...body, status };
	}

	return body;
}

function containsUnboundedQuery( options: { path?: string; url?: string } ): boolean {
	return !! options.path?.includes( 'per_page=-1' ) || !! options.url?.includes( 'per_page=-1' );
}

export const apiErrorStatusMiddleware: APIFetchMiddleware = async ( options, next ) => {
	// The caller wants the raw `Response` (e.g. the CSV export download), so
	// apiFetch's own pass-through behavior is already what they get.
	if ( options.parse === false ) {
		return next( options );
	}

	// apiFetch always keeps its built-in middlewares innermost, so this one
	// necessarily wraps `fetchAllMiddleware` — and that middleware bails out on
	// `parse: false`. Forcing parse off here would silently disable `per_page=-1`
	// pagination (which the dashboard uses to enumerate widget modules), so leave
	// unbounded queries to apiFetch's own handling.
	if ( containsUnboundedQuery( options ) ) {
		return next( options );
	}

	let result: unknown;
	try {
		result = await next( { ...options, parse: false } );
	} catch ( thrown ) {
		// With `parse: false`, apiFetch throws the raw `Response` for a non-2xx
		// reply rather than returning it (see `parseAndThrowError`). This catch
		// is where every real API error lands. Anything that is not a
		// `Response` — an offline/fetch error, an `AbortError`, a mock's own
		// rejection — has no HTTP status to add, so rethrow it untouched.
		if ( thrown instanceof Response ) {
			throw await normalizeErrorResponse( thrown );
		}
		throw thrown;
	}

	// A resolved value that is not a `Response` means a middleware outside this
	// one short-circuited with already-parsed data — Storybook's report mocks
	// do exactly that. A resolved `Response` is always 2xx: apiFetch only
	// throws (never resolves) a non-ok one.
	if ( ! ( result instanceof Response ) ) {
		return result;
	}

	if ( result.status === 204 ) {
		return null;
	}

	return parseJsonAndNormalizeError( result );
};

// apiFetch middleware registers onto a shared, process-wide chain, so guard
// against a second registration from a re-mount or HMR.
let registered = false;

export function registerApiErrorStatusMiddleware(): void {
	if ( registered ) {
		return;
	}
	// Unit tests replace the whole apiFetch module with a bare `jest.fn()`, which
	// has no `use()`. This is called at module scope, so without the check every
	// suite that renders a widget would fail to load.
	if ( typeof apiFetch.use !== 'function' ) {
		return;
	}
	registered = true;
	apiFetch.use( apiErrorStatusMiddleware );
}

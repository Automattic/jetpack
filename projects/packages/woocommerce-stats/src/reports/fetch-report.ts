/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';

const REPORTS_PATH = '/jetpack/v4/woocommerce-stats/proxy/v2/analytics/reports';

// A JSON-serializable query value: scalars, arrays of scalars, or an array of flat
// records such as `filters`.
type ReportParamScalar = string | number | boolean | undefined | null;
type ReportParamValue =
	| ReportParamScalar
	| ReportParamScalar[]
	| Record< string, ReportParamScalar | ReportParamScalar[] >[];

export type ReportRequestParams = Record< string, ReportParamValue >;

function cleanQueryParams( params?: ReportRequestParams ) {
	if ( ! params ) {
		return undefined;
	}

	const cleaned = Object.fromEntries(
		Object.entries( params ).filter( ( [ , value ] ) => value !== undefined && value !== null )
	) as ReportRequestParams;

	return Object.keys( cleaned ).length ? cleaned : undefined;
}

// Shape-checked, not `instanceof`: a `Response` from another realm fails that check.
function isResponse( value: unknown ): value is Response {
	return (
		typeof value === 'object' &&
		value !== null &&
		'status' in value &&
		typeof value.status === 'number' &&
		'json' in value &&
		typeof value.json === 'function'
	);
}

function isPlainErrorBody( body: unknown ): body is Record< string, unknown > {
	return typeof body === 'object' && body !== null && ! Array.isArray( body );
}

async function parseJson( response: Response ): Promise< unknown > {
	try {
		return await response.json();
	} catch {
		// The shape and the string are apiFetch's own, so the message stays on core's domain.
		throw {
			code: 'invalid_json',
			// eslint-disable-next-line @wordpress/i18n-text-domain
			message: __( 'The response is not a valid JSON response.', 'default' ),
		};
	}
}

/**
 * Turn a failed `Response` into the error to throw, with its HTTP status attached.
 *
 * WordPress.com errors pass through shaped `{ error, message }`, with no status in the
 * body, and the dashboard's retry and error handling read the status.
 *
 * @param response - The failed response.
 * @return The error value to throw.
 */
async function toError( response: Response ): Promise< unknown > {
	let body: unknown;
	try {
		body = await parseJson( response );
	} catch ( parseError ) {
		body = parseError;
	}

	return isPlainErrorBody( body ) && ! ( 'status' in body )
		? { ...body, status: response.status }
		: body;
}

/**
 * Request through apiFetch without its parse step, so a failure keeps its HTTP status.
 *
 * @param path - REST path of the request, query string included.
 * @return The parsed response body.
 */
async function fetchPreservingStatus< TResponse >( path: string ): Promise< TResponse > {
	let result: unknown;

	try {
		result = await apiFetch( { path, parse: false } );
	} catch ( thrown ) {
		// A network error or an abort has no status to add.
		if ( ! isResponse( thrown ) ) {
			throw thrown;
		}

		const error = await toError( thrown );

		// apiFetch only refreshes a stale nonce when it parses the response itself.
		if ( isPlainErrorBody( error ) && error.code === 'rest_cookie_invalid_nonce' ) {
			return ( await apiFetch( { path } ) ) as TResponse;
		}

		throw error;
	}

	// A middleware that resolves plain data, as a mock does, has already parsed it.
	if ( ! isResponse( result ) ) {
		return result as TResponse;
	}

	return ( result.status === 204 ? null : await parseJson( result ) ) as TResponse;
}

/**
 * Fetch a WooCommerce report through the package's proxy.
 *
 * @param endpoint - Report endpoint below `analytics/reports`, e.g. `orders/by-date`.
 * @param params   - Query params of the report request.
 * @return The report response.
 */
export async function fetchReport< TResponse = unknown >(
	endpoint: string,
	params?: ReportRequestParams
): Promise< TResponse > {
	const path = `${ REPORTS_PATH }/${ endpoint.replace( /^\/+/, '' ) }`;
	const query = cleanQueryParams( params );

	return fetchPreservingStatus< TResponse >( query ? addQueryArgs( path, query ) : path );
}

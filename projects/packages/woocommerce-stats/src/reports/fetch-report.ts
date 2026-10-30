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

/** Which provider serves the report; omitted, the server picks as it always has. */
export type ReportExecution = 'auto' | 'local' | 'remote';

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
		// The shape apiFetch throws for the same failure.
		throw {
			code: 'invalid_json',
			message: __( 'The response is not a valid JSON response.', 'jetpack-woocommerce-stats-pkg' ),
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
 * @return The parsed response body, and the headers when the response carried them.
 */
async function fetchPreservingStatus< TResponse >(
	path: string
): Promise< { body: TResponse; headers: Headers | null } > {
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
			return { body: ( await apiFetch( { path } ) ) as TResponse, headers: null };
		}

		throw error;
	}

	// A middleware that resolves plain data, as a mock does, has already parsed it.
	if ( ! isResponse( result ) ) {
		return { body: result as TResponse, headers: null };
	}

	return {
		body: ( result.status === 204 ? null : await parseJson( result ) ) as TResponse,
		headers: result.headers ?? null,
	};
}

/**
 * Fetch a WooCommerce report through the package's proxy.
 *
 * @param endpoint          - Report endpoint below `analytics/reports`, e.g. `orders/by-date`.
 * @param params            - Query params of the report request.
 * @param options           - Request options.
 * @param options.execution - The provider to force, or `auto`.
 * @param options.fields    - The report fields the caller reads; omitted, the whole report.
 * @return The report response and its headers, null when the response carried none.
 */
export async function fetchReportWithHeaders< TResponse = unknown >(
	endpoint: string,
	params?: ReportRequestParams,
	options?: { execution?: ReportExecution; fields?: string[] }
): Promise< { body: TResponse; headers: Headers | null } > {
	const path = `${ REPORTS_PATH }/${ endpoint.replace( /^\/+/, '' ) }`;
	const query = cleanQueryParams( {
		...params,
		execution: options?.execution,
		fields: options?.fields?.join( ',' ),
	} );

	return fetchPreservingStatus< TResponse >( query ? addQueryArgs( path, query ) : path );
}

/**
 * Fetch a WooCommerce report through the package's proxy, for a caller that reads only the body.
 *
 * @param endpoint          - Report endpoint below `analytics/reports`, e.g. `orders/by-date`.
 * @param params            - Query params of the report request.
 * @param options           - Request options, as `fetchReportWithHeaders` takes them.
 * @param options.execution - The provider to force, or `auto`.
 * @param options.fields    - The report fields the caller reads; omitted, the whole report.
 * @return The report response.
 */
export async function fetchReport< TResponse = unknown >(
	endpoint: string,
	params?: ReportRequestParams,
	options?: { execution?: ReportExecution; fields?: string[] }
): Promise< TResponse > {
	return ( await fetchReportWithHeaders< TResponse >( endpoint, params, options ) ).body;
}

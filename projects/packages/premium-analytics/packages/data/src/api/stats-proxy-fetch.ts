/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
/**
 * Internal dependencies
 */
import { statsProxyPath } from './constants';

export type StatsProxyVersion = '1.1' | '1.2' | '2';

export type StatsProxyMethod = 'GET' | 'POST';

export type StatsProxyParams = Record<
	string,
	string | number | boolean | undefined | Array< string | number | boolean >
>;

export type StatsProxyFetchParams< TBody = unknown > = {
	version: StatsProxyVersion;
	endpoint: string;
	params?: StatsProxyParams;
	method?: StatsProxyMethod;
	body?: TBody;
};

type ResponseLike = {
	ok?: boolean;
	status: number;
	statusText?: string;
	json: () => Promise< unknown >;
};

function normalizeEndpoint( endpoint: string ) {
	return endpoint.replace( /^\/+/, '' );
}

function cleanQueryParams( params?: StatsProxyParams ) {
	if ( ! params ) {
		return undefined;
	}

	const cleaned = Object.fromEntries(
		Object.entries( params ).filter( ( [ , value ] ) => value !== undefined && value !== null )
	) as StatsProxyParams;

	return Object.keys( cleaned ).length ? cleaned : undefined;
}

export function getStatsProxyPath( {
	version,
	endpoint,
	params,
}: Pick< StatsProxyFetchParams, 'version' | 'endpoint' | 'params' > ) {
	const path = `${ statsProxyPath }/v${ version }/${ normalizeEndpoint( endpoint ) }`;
	const queryParams = cleanQueryParams( params );

	return queryParams ? addQueryArgs( path, queryParams ) : path;
}

function isResponseLike( value: unknown ): value is ResponseLike {
	return (
		!! value &&
		typeof value === 'object' &&
		typeof ( value as ResponseLike ).status === 'number' &&
		typeof ( value as ResponseLike ).json === 'function'
	);
}

async function parseStatsProxyResponse< TResponse >(
	response: ResponseLike
): Promise< TResponse > {
	return response.status === 204
		? ( null as TResponse )
		: ( ( await response.json() ) as TResponse );
}

async function throwStatsProxyError( error: unknown ): Promise< never > {
	if ( ! isResponseLike( error ) ) {
		throw error;
	}

	let body: unknown;
	try {
		body = await error.json();
	} catch {
		throw {
			code: 'invalid_json',
			message: 'The response is not a valid JSON response.',
			status: error.status,
		};
	}

	if ( body && typeof body === 'object' ) {
		throw {
			...( body as Record< string, unknown > ),
			status: error.status,
		};
	}

	throw {
		code: 'api_error',
		message: error.statusText || 'Error processing the request.',
		status: error.status,
		data: body,
	};
}

export async function fetchStatsProxy< TResponse = unknown, TBody = unknown >( {
	version,
	endpoint,
	params,
	method = 'GET',
	body,
}: StatsProxyFetchParams< TBody > ): Promise< TResponse > {
	const path = getStatsProxyPath( { version, endpoint, params } );

	try {
		const response = await apiFetch< never, false >( {
			path,
			method,
			parse: false,
			...( method === 'POST' ? { data: body } : {} ),
		} );

		return parseStatsProxyResponse< TResponse >( response );
	} catch ( error ) {
		return throwStatsProxyError( error );
	}
}

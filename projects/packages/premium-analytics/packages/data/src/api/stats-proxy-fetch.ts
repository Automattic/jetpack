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

export async function fetchStatsProxy< TResponse = unknown, TBody = unknown >( {
	version,
	endpoint,
	params,
	method = 'GET',
	body,
}: StatsProxyFetchParams< TBody > ): Promise< TResponse > {
	const path = getStatsProxyPath( { version, endpoint, params } );

	return apiFetch< TResponse >( {
		path,
		method,
		...( method === 'POST' ? { data: body } : {} ),
	} );
}

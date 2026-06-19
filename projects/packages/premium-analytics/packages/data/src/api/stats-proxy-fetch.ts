/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
/**
 * Internal dependencies
 */
import { statsProxyPath } from './constants';

export type StatsProxyVersion = '1.1' | '1.2' | '2' | ( string & {} );

export type StatsProxyMethod = 'GET' | 'POST';

export type StatsProxyParams = Record<
	string,
	string | number | boolean | null | undefined | Array< string | number | boolean >
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

export function getStatsProxyPath( {
	version,
	endpoint,
	params,
}: Pick< StatsProxyFetchParams, 'version' | 'endpoint' | 'params' > ) {
	const path = `${ statsProxyPath }/v${ version }/${ normalizeEndpoint( endpoint ) }`;

	return params ? addQueryArgs( path, params ) : path;
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

export type StatsProxyQueryParams = StatsProxyFetchParams;

/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
/**
 * Internal dependencies
 */
import { getWpcomBlogId, isWpcomSimpleSite, statsProxyPath } from './constants';

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

function isGlobalWpcomSimpleEndpoint( endpoint: string ) {
	return normalizeEndpoint( endpoint ) === 'upgrades';
}

function getBasePath( version: StatsProxyVersion ) {
	if ( ! isWpcomSimpleSite() ) {
		return `${ statsProxyPath }/v${ version }`;
	}

	return version === '2' ? '/wpcom/v2' : `/rest/v${ version }`;
}

function addWpcomSimpleSiteQuery(
	params: StatsProxyParams | undefined
): StatsProxyParams | undefined {
	if ( ! isWpcomSimpleSite() ) {
		return params;
	}

	const blogId = getWpcomBlogId();
	if ( ! blogId || params?.site ) {
		return params;
	}

	return {
		...params,
		site: blogId,
	};
}

export function getStatsProxyPath( {
	version,
	endpoint,
	params,
}: Pick< StatsProxyFetchParams, 'version' | 'endpoint' | 'params' > ) {
	const normalizedEndpoint = normalizeEndpoint( endpoint );
	const path = `${ getBasePath( version ) }/${ normalizedEndpoint }`;
	const queryParams = cleanQueryParams(
		isGlobalWpcomSimpleEndpoint( normalizedEndpoint ) ? addWpcomSimpleSiteQuery( params ) : params
	);

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
	const fetchOptions = {
		path,
		method,
		...( method === 'POST' ? { data: body } : {} ),
		...( isWpcomSimpleSite() && isGlobalWpcomSimpleEndpoint( endpoint ) ? { global: true } : {} ),
	};

	return apiFetch< TResponse >( fetchOptions );
}

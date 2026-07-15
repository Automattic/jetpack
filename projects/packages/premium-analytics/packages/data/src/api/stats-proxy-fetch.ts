/**
 * External dependencies
 */
import { getScriptData, isSimpleSite } from '@automattic/jetpack-script-data';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
/**
 * Internal dependencies
 */
import { statsProxyPath } from './constants';

export type StatsProxyVersion = '1.1' | '1.2' | '2';

export type StatsProxyMethod = 'GET' | 'POST';

export type StatsProxyParams = Record< string, unknown >;

export type StatsProxyFetchParams< TBody = unknown > = {
	version: StatsProxyVersion;
	endpoint: string;
	params?: StatsProxyParams;
	method?: StatsProxyMethod;
	body?: TBody;
};

type ResolvedStatsProxyRequest = {
	path: string;
	global?: boolean;
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

/**
 * Resolve the request for a stats endpoint in the current environment.
 *
 * Connected Jetpack sites reach WPCOM through the local Premium Analytics
 * proxy. WPCOM Simple has no local proxy: requests use public-api namespaces
 * directly and are dispatched by WPCOM's wp-admin apiFetch bridge, which
 * site-scopes every path unless the request is marked `global`. `upgrades`
 * is a global public-api endpoint, so it opts out of the path scoping and
 * carries the site as a query arg instead.
 *
 * @param request          - The stats request to resolve.
 * @param request.version  - WPCOM API version (`1.1`, `1.2`, or `2`).
 * @param request.endpoint - Endpoint path below the version base.
 * @param request.params   - Query params of the request.
 * @return The apiFetch path, plus `global: true` for global WPCOM endpoints.
 */
function resolveStatsProxyRequest( {
	version,
	endpoint,
	params,
}: Pick< StatsProxyFetchParams, 'version' | 'endpoint' | 'params' > ): ResolvedStatsProxyRequest {
	const normalizedEndpoint = normalizeEndpoint( endpoint );

	if ( ! isSimpleSite() ) {
		const path = `${ statsProxyPath }/v${ version }/${ normalizedEndpoint }`;
		const queryParams = cleanQueryParams( params );
		return { path: queryParams ? addQueryArgs( path, queryParams ) : path };
	}

	const base = version === '2' ? '/wpcom/v2' : `/rest/v${ version }`;
	const path = `${ base }/${ normalizedEndpoint }`;

	if ( normalizedEndpoint !== 'upgrades' ) {
		const queryParams = cleanQueryParams( params );
		return { path: queryParams ? addQueryArgs( path, queryParams ) : path };
	}

	const blogId = getScriptData()?.site?.wpcom?.blog_id;
	const queryParams = cleanQueryParams(
		blogId && ! params?.site ? { ...params, site: blogId } : params
	);
	return {
		path: queryParams ? addQueryArgs( path, queryParams ) : path,
		global: true,
	};
}

export function getStatsProxyPath(
	request: Pick< StatsProxyFetchParams, 'version' | 'endpoint' | 'params' >
) {
	return resolveStatsProxyRequest( request ).path;
}

/**
 * Fetch a Woo analytics report through the stats transport.
 *
 * @param endpoint - Report endpoint below `analytics/reports`, e.g. `orders/by-date`.
 * @param params   - Query params of the report request.
 * @return The report response.
 */
export async function fetchReport< TResponse = unknown >(
	endpoint: string,
	params?: StatsProxyParams
): Promise< TResponse > {
	return fetchStatsProxy< TResponse >( {
		version: '2',
		endpoint: `analytics/reports/${ normalizeEndpoint( endpoint ) }`,
		params,
	} );
}

export async function fetchStatsProxy< TResponse = unknown, TBody = unknown >( {
	version,
	endpoint,
	params,
	method = 'GET',
	body,
}: StatsProxyFetchParams< TBody > ): Promise< TResponse > {
	const { path, global: isGlobal } = resolveStatsProxyRequest( { version, endpoint, params } );

	return apiFetch< TResponse >( {
		path,
		method,
		...( method === 'POST' ? { data: body } : {} ),
		...( isGlobal ? { global: true } : {} ),
	} );
}

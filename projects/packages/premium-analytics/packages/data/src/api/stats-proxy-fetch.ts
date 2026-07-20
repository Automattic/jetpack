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

// A JSON-serializable query value: scalars, arrays of scalars (e.g. a
// multi-select param), or an array of flat scalar-valued records (e.g.
// `filters`, a list of `FilterCondition`-shaped objects). Rejects functions,
// Dates, and class instances that `addQueryArgs` can't serialize, while still
// admitting nested filter conditions.
type StatsProxyParamScalar = string | number | boolean | undefined | null;
type StatsProxyParamValue =
	| StatsProxyParamScalar
	| StatsProxyParamScalar[]
	| Record< string, StatsProxyParamScalar | StatsProxyParamScalar[] >[];

export type StatsProxyParams = Record< string, StatsProxyParamValue >;

export type StatsProxyFetchParams< TBody = unknown > = {
	version: StatsProxyVersion;
	endpoint: string;
	params?: StatsProxyParams;
	method?: StatsProxyMethod;
	body?: TBody;
	/**
	 * Marks a request to a global (non-site-scoped) WPCOM public-api endpoint,
	 * e.g. `upgrades`. Only meaningful on Simple: callers must opt in
	 * explicitly rather than relying on an endpoint-name match, since a
	 * future endpoint under the same prefix (e.g. `upgrades/foo`) would
	 * otherwise silently miss the global-request handling.
	 */
	global?: boolean;
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
 * site-scopes every path unless the request is marked `global`. A caller
 * passing `global: true` (e.g. the `upgrades` endpoint) opts out of that path
 * scoping and carries the site as a query arg instead.
 *
 * @param request          - The stats request to resolve.
 * @param request.version  - WPCOM API version (`1.1`, `1.2`, or `2`).
 * @param request.endpoint - Endpoint path below the version base.
 * @param request.params   - Query params of the request.
 * @param request.global   - Whether this targets a global (non-site-scoped) endpoint.
 * @return The apiFetch path, plus `global: true` for global WPCOM endpoints.
 */
function resolveStatsProxyRequest( {
	version,
	endpoint,
	params,
	global,
}: Pick<
	StatsProxyFetchParams,
	'version' | 'endpoint' | 'params' | 'global'
> ): ResolvedStatsProxyRequest {
	const normalizedEndpoint = normalizeEndpoint( endpoint );

	if ( ! isSimpleSite() ) {
		const path = `${ statsProxyPath }/v${ version }/${ normalizedEndpoint }`;
		const queryParams = cleanQueryParams( params );
		return { path: queryParams ? addQueryArgs( path, queryParams ) : path };
	}

	const base = version === '2' ? '/wpcom/v2' : `/rest/v${ version }`;
	const path = `${ base }/${ normalizedEndpoint }`;

	if ( ! global ) {
		const queryParams = cleanQueryParams( params );
		return { path: queryParams ? addQueryArgs( path, queryParams ) : path };
	}

	const blogId = getScriptData()?.site?.wpcom?.blog_id;
	if ( ! blogId && ! params?.site ) {
		// A global request with no site to scope to would return data across
		// every site the user can access, not this site's — silently wrong
		// data rather than a visible error. Fail loudly instead: this surfaces
		// as a query error the widget's error state can show and retry.
		throw new Error(
			`Global WPCOM Simple request to "${ normalizedEndpoint }" has no site to scope to: ` +
				'JetpackScriptData.site.wpcom.blog_id is missing and no site param was provided.'
		);
	}

	const queryParams = cleanQueryParams(
		blogId && ! params?.site ? { ...params, site: blogId } : params
	);
	return {
		path: queryParams ? addQueryArgs( path, queryParams ) : path,
		global: true,
	};
}

export function getStatsProxyPath(
	request: Pick< StatsProxyFetchParams, 'version' | 'endpoint' | 'params' | 'global' >
) {
	return resolveStatsProxyRequest( request ).path;
}

const localNoticesPath = '/jetpack-premium-analytics/v1/notices';

// WPCOM Simple has no local notices endpoint: requests use the WPCOM Stats
// notices endpoint directly, dispatched by WPCOM's wp-admin apiFetch bridge.
const wpcomSimpleNoticesPath = '/wpcom/v2/jetpack-stats-dashboard/notices';

/**
 * Resolve the notices endpoint path for the current environment.
 *
 * @return The notices path.
 */
export function getNoticesPath() {
	return isSimpleSite() ? wpcomSimpleNoticesPath : localNoticesPath;
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
	global,
}: StatsProxyFetchParams< TBody > ): Promise< TResponse > {
	const { path, global: isGlobal } = resolveStatsProxyRequest( {
		version,
		endpoint,
		params,
		global,
	} );

	return apiFetch< TResponse >( {
		path,
		method,
		...( method === 'POST' ? { data: body } : {} ),
		...( isGlobal ? { global: true } : {} ),
	} );
}

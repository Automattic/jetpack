import {
	fetchStatsProxy,
	type StatsProxyParams,
} from '@jetpack-premium-analytics/data/src/api/stats-proxy-fetch';

function normalizeEndpoint( endpoint: string ) {
	return endpoint.replace( /^\/+/, '' );
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

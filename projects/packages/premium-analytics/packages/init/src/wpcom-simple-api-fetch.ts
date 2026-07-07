/**
 * External dependencies
 */
import { getScriptData, isSimpleSite } from '@automattic/jetpack-script-data';
import apiFetch from '@wordpress/api-fetch';

type ApiFetchOptions = Parameters< typeof apiFetch >[ 0 ] & {
	global?: boolean;
};

const localProxyPrefix = '/jetpack-premium-analytics/v1/proxy/';
const localNoticesPath = '/jetpack-premium-analytics/v1/notices';
const wpcomNoticesPath = '/wpcom/v2/jetpack-stats-dashboard/notices';

let wpcomSimpleMiddlewareConfigured = false;

/**
 * Append the current site query required by global WPCOM endpoints.
 *
 * @param path - API path to update.
 * @return API path with the current site query when available.
 */
function appendSiteQuery( path: string ): string {
	if ( /([?&])site=/.test( path ) ) {
		return path;
	}

	const blogId = getScriptData()?.site?.wpcom?.blog_id;
	if ( ! blogId ) {
		return path;
	}

	return `${ path }${ path.includes( '?' ) ? '&' : '?' }site=${ encodeURIComponent( blogId ) }`;
}

/**
 * Resolve the public-api namespace for a proxied request version.
 *
 * @param version - API version from the local proxy path.
 * @return WPCOM public-api namespace path.
 */
function getWpcomApiBasePath( version: string ): string {
	return version === '2' ? '/wpcom/v2' : `/rest/v${ version }`;
}

/**
 * Rewrite local Premium Analytics proxy options for WPCOM Simple.
 *
 * @param options - apiFetch options.
 * @return Rewritten apiFetch options when the request targets Premium Analytics.
 */
export function getWpcomSimpleApiFetchOptions( options: ApiFetchOptions ): ApiFetchOptions {
	const path = options.path;
	if ( typeof path !== 'string' ) {
		return options;
	}

	if ( path === localNoticesPath || path.startsWith( `${ localNoticesPath }?` ) ) {
		return {
			...options,
			path: `${ wpcomNoticesPath }${ path.slice( localNoticesPath.length ) }`,
		};
	}

	if ( ! path.startsWith( localProxyPrefix ) ) {
		return options;
	}

	const proxyPath = path.slice( localProxyPrefix.length );
	const match = proxyPath.match( /^v([^/]+)(\/.*)?$/ );
	if ( ! match ) {
		return options;
	}

	const version = match[ 1 ];
	const endpointWithQuery = match[ 2 ] ?? '';
	const wpcomPath = `${ getWpcomApiBasePath( version ) }${ endpointWithQuery }`;

	if ( endpointWithQuery === '/upgrades' || endpointWithQuery.startsWith( '/upgrades?' ) ) {
		return {
			...options,
			path: appendSiteQuery( wpcomPath ),
			global: true,
		};
	}

	return {
		...options,
		path: wpcomPath,
	};
}

/**
 * Register the WPCOM Simple apiFetch rewrite middleware.
 */
export function setupWpcomSimpleApiFetch(): void {
	if ( wpcomSimpleMiddlewareConfigured || ! isSimpleSite() ) {
		return;
	}

	apiFetch.use( ( options, next ) => next( getWpcomSimpleApiFetchOptions( options ) ) );
	wpcomSimpleMiddlewareConfigured = true;
}

/**
 * Read-only stand-in for the Calypso Redux store: the dashboard only ever held the boot-time site and user.
 */
import { useSyncExternalStore } from 'react';
import config from './config';
import { getRouteState, subscribe, type RouteState } from './router';
import { versionCompare } from './utils';
import type { AnalyticsAction } from './analytics';

/* eslint-disable @typescript-eslint/no-explicit-any */
export type SiteDetails = Record< string, any > & {
	ID: number;
	URL: string;
	slug: string;
	domain: string;
	options: Record< string, any >;
};

export type APIError = {
	code?: string;
	message?: string;
	errorCode?: string;
	status?: number;
};

export type AppState = {
	route: RouteState;
};

/**
 * The raw site from the boot config.
 *
 * @return Raw site, or null.
 */
function getRawSite(): Record< string, any > | null {
	const id = config( 'blog_id' );
	return config( 'initial_state' )?.sites?.items?.[ id ] ?? null;
}

/**
 * The site URL without protocol, with `/` swapped for `::`, as Calypso slugs it.
 *
 * @param url - Site URL.
 * @return Slug.
 */
function urlToSlug( url: string ) {
	return url
		.replace( /^https?:\/\//, '' )
		.replace( /\/$/, '' )
		.replace( /\//g, '::' );
}

let site: SiteDetails | null = null;

/**
 * The selected site with Calypso's computed attributes.
 *
 * @return Site, or null.
 */
export function getSelectedSite(): SiteDetails | null {
	if ( site ) {
		return site;
	}
	const raw = getRawSite();
	if ( ! raw ) {
		return null;
	}
	const slug = urlToSlug( raw.URL || '' ) || config( 'hostname' );
	site = {
		...raw,
		ID: Number( raw.ID ),
		slug,
		domain: slug,
		title: config( 'site_name' ),
		options: raw.options || {},
	} as unknown as SiteDetails;
	return site;
}

/* eslint-disable @typescript-eslint/no-unused-vars -- The selectors keep Calypso's ( state, siteId ) signatures; there is one site. */
export const getSelectedSiteId = (): number => config( 'blog_id' ) || 0;
export const getSelectedSiteSlug = (): string => getSelectedSite()?.slug ?? config( 'hostname' );
export const getSite = ( _state?: unknown, _siteId?: unknown ) => getSelectedSite();
export const getSiteSlug = ( _state?: unknown, _siteId?: unknown ) => getSelectedSiteSlug();
export const getSiteOption = ( _state: unknown, _siteId: unknown, option: string ) =>
	getSelectedSite()?.options?.[ option ];
export const getSiteAdminUrl = ( _state?: unknown, _siteId?: unknown ) =>
	getSiteOption( null, null, 'admin_url' );
export const isAtomicSite = ( _state?: unknown, _siteId?: unknown ) =>
	!! getSiteOption( null, null, 'is_wpcom_atomic' );
/* eslint-enable @typescript-eslint/no-unused-vars */

/**
 * Whether the site is a Jetpack site.
 *
 * @param _state                           - Unused.
 * @param _siteId                          - Unused.
 * @param options                          - Options.
 * @param options.treatAtomicAsJetpackSite - Whether Atomic counts as Jetpack.
 * @return Whether it is.
 */
export function isJetpackSite(
	_state?: unknown,
	_siteId?: unknown,
	{ treatAtomicAsJetpackSite = true } = {}
): boolean {
	const selected = getSelectedSite();
	if ( ! selected?.jetpack ) {
		return false;
	}
	return treatAtomicAsJetpackSite || ! isAtomicSite();
}

export const isJetpackMinimumVersion = ( _state: unknown, _siteId: unknown, version: string ) => {
	const current = getSiteOption( null, null, 'jetpack_version' );
	return current ? versionCompare( current, version, '>=' ) : null;
};

export const isJetpackModuleActive = ( _state: unknown, _siteId: unknown, slug: string ) => {
	const modules = getSiteOption( null, null, 'active_modules' );
	return Array.isArray( modules ) ? modules.includes( slug ) : null;
};

export const getCurrentUser = () => config( 'initial_state' )?.currentUser?.user ?? null;
export const getCurrentUserId = () => getCurrentUser()?.ID ?? null;
export const getCurrentQueryArguments = ( state?: AppState ) =>
	( state?.route ?? getRouteState() ).query;
export const getPreviousRoute = ( state?: AppState ) =>
	( state?.route ?? getRouteState() ).previousPath ?? '';

/**
 * `useSelector` over the static site and user plus the live route.
 *
 * @param selector - Selector called with `{ route }`.
 * @return Selected value.
 */
export function useSelector< T >( selector: ( state: AppState ) => T ): T {
	const route = useSyncExternalStore( subscribe, getRouteState, getRouteState );
	return selector( { route } );
}

/**
 * `useDispatch` that runs analytics actions.
 *
 * @return Dispatch.
 */
export function useDispatch() {
	return dispatch;
}

/**
 * Run an action.
 *
 * @param action - Analytics action.
 */
export function dispatch( action: AnalyticsAction | unknown ) {
	if ( typeof action === 'function' ) {
		( action as AnalyticsAction )();
	}
}

export type Dispatch = typeof dispatch;

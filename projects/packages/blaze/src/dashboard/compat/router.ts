/**
 * Hashbang router standing in for `@automattic/calypso-router` (page.js), keeping the `#!/advertising/...` URLs.
 */
import { useSyncExternalStore } from 'react';
import config from './config';

export type RouteState = {
	path: string;
	pathname: string;
	query: Record< string, string >;
	previousPath: string | null;
	// False while the Jetpack admin shell shows another dashboard; the URL is not ours then.
	active: boolean;
};

type Listener = () => void;

const listeners = new Set< Listener >();
let active = isOwnPage();
let state: RouteState = read( null );

/**
 * Whether the URL is this dashboard's admin page, rather than another one the admin shell shows.
 *
 * @return Whether it is.
 */
function isOwnPage() {
	if ( typeof window === 'undefined' ) {
		return false;
	}
	const slug = config( 'menu_slug' );
	return ! slug || new URLSearchParams( window.location.search ).get( 'page' ) === slug;
}

/**
 * Parse the current hash into a route state.
 *
 * @param previousPath - The path before this one.
 * @return The route state.
 */
function read( previousPath: string | null ): RouteState {
	const hash = typeof window === 'undefined' || ! active ? '' : window.location.hash;
	const path = hash.startsWith( '#!' ) ? hash.slice( 2 ) : '';
	const [ pathname, search = '' ] = path.split( '?' );
	return {
		path,
		pathname,
		query: Object.fromEntries( new URLSearchParams( search ) ),
		previousPath,
		active,
	};
}

/**
 * Re-read the hash and notify subscribers.
 */
function sync() {
	let next: RouteState;
	if ( ! active ) {
		// Hidden by the admin shell: keep the last route so the app stays as it was.
		if ( ! state.active ) {
			return;
		}
		next = { ...state, active: false };
	} else {
		next = read( state.path || null );
		if ( next.path === state.path && state.active ) {
			return;
		}
	}
	state = next;
	listeners.forEach( listener => listener() );
}

/**
 * Follow the admin shell showing and hiding this dashboard.
 *
 * @param event - Shell event.
 */
function onShellPage( event: Event ) {
	const { page: slug } = ( event as CustomEvent< { page?: string } > ).detail || {};
	if ( slug !== config( 'menu_slug' ) ) {
		return;
	}
	active = event.type === 'jetpack-admin-shell:page-shown';
	sync();
}

if ( typeof window !== 'undefined' ) {
	window.addEventListener( 'hashchange', sync );
	window.addEventListener( 'popstate', sync );
	window.addEventListener( 'jetpack-admin-shell:page-shown', onShellPage );
	window.addEventListener( 'jetpack-admin-shell:page-hidden', onShellPage );
}

/**
 * Build the full URL for a dashboard path.
 *
 * @param path - Dashboard path, e.g. `/advertising/campaigns/example.com`.
 * @return URL with the hashbang.
 */
function hrefFor( path: string ) {
	const { pathname, search } = window.location;
	return `${ pathname }${ search }#!${ path }`;
}

/**
 * Navigate to a dashboard path, adding a history entry.
 *
 * @param path - Dashboard path.
 */
function page( path: string ) {
	window.history.pushState( null, '', hrefFor( path ) );
	sync();
}

/**
 * Navigate without adding a history entry.
 *
 * @param path - Dashboard path.
 */
page.redirect = ( path: string ) => {
	window.history.replaceState( null, '', hrefFor( path ) );
	sync();
};
page.replace = page.redirect;
page.show = page.redirect;
page.back = () => window.history.back();

/**
 * Current route state.
 *
 * @return Route state.
 */
export const getRouteState = (): RouteState => state;

/**
 * Subscribe to route changes.
 *
 * @param listener - Called on every change.
 * @return Unsubscribe.
 */
export function subscribe( listener: Listener ) {
	listeners.add( listener );
	return () => listeners.delete( listener );
}

/**
 * React hook for the current route.
 *
 * @return Route state.
 */
export function useRoute(): RouteState {
	return useSyncExternalStore( subscribe, getRouteState, getRouteState );
}

/**
 * Match a page.js-style pattern (`/a/:b/:c?`) against a pathname.
 *
 * @param pattern  - Pattern.
 * @param pathname - Pathname.
 * @return Params, or null when it does not match.
 */
export function matchPath( pattern: string, pathname: string ): Record< string, string > | null {
	const names: string[] = [];
	const source = pattern
		.replace( /\/:(\w+)(\?)?/g, ( _m, name, optional ) => {
			names.push( name );
			return optional ? '(?:/([^/]+))?' : '/([^/]+)';
		} )
		.replace( /\*/g, '.*' );
	const match = new RegExp( `^${ source }/?$` ).exec( pathname );
	if ( ! match ) {
		return null;
	}
	return Object.fromEntries(
		names.map( ( name, i ) => [ name, match[ i + 1 ] && decodeURIComponent( match[ i + 1 ] ) ] )
	);
}

export default page;

/**
 * External dependencies
 */
import { dispatch } from '@wordpress/data';
import { useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useSearch } from '@wordpress/route';
import type { DateLimitFeature } from '@jetpack-premium-analytics/data';

type Search = Record< string, unknown >;
type NoticesActions = { createInfoNotice: ( message: string, options: object ) => void };

export const DATE_WINDOW_NOTICE_ID = 'jetpack-premium-analytics/date-window-limited';

// `REPORT_DATE_PARAM_KEYS` plus `section`, spelled out so this module stays clear of the routing barrel.
const WINDOW_KEYS = [
	'from',
	'to',
	'preset',
	'interval',
	'comp',
	'compare_from',
	'compare_to',
	'compare_preset',
	'section',
];

type Pending = { feature: DateLimitFeature; key: string } | undefined;

// Each route bundles its own copy of this module, so the held notice lives on globalThis.
const PENDING_SLOT = Symbol.for( 'jetpack-premium-analytics/date-window-notice' );
const slot = globalThis as typeof globalThis & { [ PENDING_SLOT ]?: Pending };

/**
 * A route's path with its params filled in, such as `/post/42` for `/post/$postId`.
 *
 * @param path   - The route path.
 * @param params - The route params.
 * @return The pathname.
 */
export function routePathname( path: string, params: Record< string, unknown > = {} ): string {
	return path.replace( /\$(\w+)/g, ( match, name: string ) =>
		params[ name ] === undefined ? match : String( params[ name ] )
	);
}

/**
 * What identifies a page's date window, alike for a redirect target and the page that renders it.
 *
 * @param search   - The search.
 * @param pathname - The page's pathname, from `routePathname`.
 * @return The key.
 */
export function dateWindowKey( search: Search, pathname: string ): string {
	// The router hands values back JSON-parsed, so `comp: '1'` returns as the number 1.
	return JSON.stringify( [
		pathname,
		...WINDOW_KEYS.map( key => ( search[ key ] === undefined ? null : String( search[ key ] ) ) ),
	] );
}

/**
 * Hold a notice for the page that lands on a limited search.
 *
 * @param feature  - The locked feature that sets the limit.
 * @param search   - The search the route redirects to.
 * @param pathname - The pathname it redirects to.
 */
export function queueDateWindowNotice(
	feature: DateLimitFeature,
	search: Search,
	pathname: string
): void {
	slot[ PENDING_SLOT ] = { feature, key: dateWindowKey( search, pathname ) };
}

/**
 * Take the held notice: its feature when the page shows the search it was held for.
 *
 * @param key - The `dateWindowKey` of the search the page shows.
 * @return The feature, or undefined.
 */
export function takeDateWindowNotice( key: string ): DateLimitFeature | undefined {
	const held = slot[ PENDING_SLOT ];
	slot[ PENDING_SLOT ] = undefined;

	return held?.key === key ? held.feature : undefined;
}

/**
 * Tell the reader, in a snackbar, why their window changed.
 *
 * @param feature - The locked feature that sets the limit.
 */
function announceDateWindowLimit( feature: DateLimitFeature ) {
	const message =
		feature === 'recent-7-days'
			? __(
					'Your plan doesn’t include that period, so this page shows the last 7 days.',
					'jetpack-premium-analytics-pkg'
				)
			: __(
					'Your plan doesn’t include that period, so this page shows the last 30 days.',
					'jetpack-premium-analytics-pkg'
				);

	( dispatch( 'core/notices' ) as NoticesActions ).createInfoNotice( message, {
		id: DATE_WINDOW_NOTICE_ID,
		type: 'snackbar',
	} );
}

/**
 * Show the notice a route held for the window this page shows.
 *
 * A route's `beforeLoad` also runs to preload a hovered link, so it holds the notice
 * rather than showing it, and the next page this renders drops it unless it is that page.
 *
 * @param pathname - The page's pathname, from `routePathname`.
 */
export function useDateWindowNotice( pathname: string ): void {
	const key = dateWindowKey(
		( useSearch( { strict: false } ) as Search | undefined ) ?? {},
		pathname
	);

	useEffect( () => {
		const feature = takeDateWindowNotice( key );
		if ( feature ) {
			announceDateWindowLimit( feature );
		}
	}, [ key ] );
}

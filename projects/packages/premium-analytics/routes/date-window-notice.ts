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
 * What identifies a search's date window, alike for a redirect target and the search the page reads back.
 *
 * @param search - The search.
 * @return The key.
 */
export function dateWindowKey( search: Search ): string {
	// The router hands values back JSON-parsed, so `comp: '1'` returns as the number 1.
	return JSON.stringify(
		WINDOW_KEYS.map( key => ( search[ key ] === undefined ? null : String( search[ key ] ) ) )
	);
}

/**
 * Hold a notice for the page that lands on a limited search.
 *
 * @param feature - The locked feature that sets the limit.
 * @param search  - The search the route redirects to.
 */
export function queueDateWindowNotice( feature: DateLimitFeature, search: Search ): void {
	slot[ PENDING_SLOT ] = { feature, key: dateWindowKey( search ) };
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
 * rather than showing it, and a page that never lands on that window drops it.
 */
export function useDateWindowNotice(): void {
	const key = dateWindowKey( ( useSearch( { strict: false } ) as Search | undefined ) ?? {} );

	useEffect( () => {
		const feature = takeDateWindowNotice( key );
		if ( feature ) {
			announceDateWindowLimit( feature );
		}
	}, [ key ] );
}

/**
 * External dependencies
 */
import { dispatch } from '@wordpress/data';
import { useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useSearch } from '@wordpress/route';
import type { DateLimitFeature } from '@jetpack-premium-analytics/data';

type NoticesActions = { createInfoNotice: ( message: string, options: object ) => void };
type HistoryState = Record< string, unknown >;

export const DATE_WINDOW_NOTICE_ID = 'jetpack-premium-analytics/date-window-limited';

export const DATE_WINDOW_NOTICE_STATE = 'jetpackPremiumAnalyticsDateWindowNotice';

/**
 * The history state a limiting redirect carries, so only the page it lands on shows the notice.
 *
 * A route's `beforeLoad` also runs to preload a hovered link, and a preload never commits its redirect.
 *
 * @param feature - The locked feature that moved the window, or undefined for no notice.
 * @return The state, or undefined.
 */
export function dateWindowNoticeState(
	feature: DateLimitFeature | undefined
): HistoryState | undefined {
	return feature ? { [ DATE_WINDOW_NOTICE_STATE ]: feature } : undefined;
}

/**
 * Whether a history state value names a date limit.
 *
 * @param value - The value.
 * @return Whether it is a `DateLimitFeature`.
 */
function isDateLimitFeature( value: unknown ): value is DateLimitFeature {
	return value === 'recent-7-days' || value === 'long-date-presets';
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
 * Show the notice the redirect that landed on this page carried.
 */
export function useDateWindowNotice(): void {
	const search = useSearch( { strict: false } );

	useEffect( () => {
		const state = window.history.state as HistoryState | null;
		const feature = state?.[ DATE_WINDOW_NOTICE_STATE ];
		if ( ! isDateLimitFeature( feature ) ) {
			return;
		}

		// Cleared so going back to this entry, or reloading it, does not repeat the notice.
		const rest = { ...state };
		delete rest[ DATE_WINDOW_NOTICE_STATE ];
		window.history.replaceState( rest, '' );
		announceDateWindowLimit( feature );
	}, [ search ] );
}

import { SocialStoreState, TrafficInterval, TrafficReferrerDay } from '../types';

/**
 * Currently selected interval (days) for the Overview traffic chart.
 *
 * @param state - Store state.
 * @return The active interval.
 */
export function getTrafficInterval( state: SocialStoreState ): TrafficInterval {
	return state.trafficStats?.interval ?? 30;
}

/**
 * Referrer days payload for the requested interval (or the active
 * interval when none is provided). Returns `undefined` while the
 * first fetch is in flight so consumers can distinguish "loading"
 * from "loaded but empty".
 *
 * @param state      - Store state.
 * @param [interval] - Interval to read; defaults to the active one.
 * @return The per-day referrer payload, or `undefined`.
 */
export function getTrafficReferrers(
	state: SocialStoreState,
	interval?: TrafficInterval
): Record< string, TrafficReferrerDay > | undefined {
	const key = interval ?? state.trafficStats?.interval ?? 30;
	return state.trafficStats?.byInterval?.[ key ]?.days;
}

/**
 * Whether the referrers fetch is in flight for the requested interval
 * (or the active interval when none is provided).
 *
 * @param state      - Store state.
 * @param [interval] - Interval to read; defaults to the active one.
 * @return True while the API request is pending.
 */
export function isTrafficReferrersLoading(
	state: SocialStoreState,
	interval?: TrafficInterval
): boolean {
	const key = interval ?? state.trafficStats?.interval ?? 30;
	return Boolean( state.trafficStats?.byInterval?.[ key ]?.loading );
}

/**
 * Whether the last referrers fetch failed for the requested interval
 * (or the active interval when none is provided). Lets the card show a
 * distinct error affordance instead of the "no traffic yet" empty state.
 *
 * @param state      - Store state.
 * @param [interval] - Interval to read; defaults to the active one.
 * @return True when the most recent fetch errored.
 */
export function getTrafficReferrersError(
	state: SocialStoreState,
	interval?: TrafficInterval
): boolean {
	const key = interval ?? state.trafficStats?.interval ?? 30;
	return Boolean( state.trafficStats?.byInterval?.[ key ]?.error );
}

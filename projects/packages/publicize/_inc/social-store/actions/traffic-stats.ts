import { TrafficInterval, TrafficReferrerDay } from '../types';
import {
	FETCH_TRAFFIC_REFERRERS,
	RECEIVE_TRAFFIC_REFERRERS,
	RECEIVE_TRAFFIC_REFERRERS_ERROR,
	SET_TRAFFIC_INTERVAL,
} from './constants';

/**
 * Set the active interval (in days) for the Overview traffic chart.
 *
 * @param interval - Number of days the chart should cover.
 * @return Action object.
 */
export function setTrafficInterval( interval: TrafficInterval ) {
	return {
		type: SET_TRAFFIC_INTERVAL,
		interval,
	};
}

/**
 * Signal that the referrers fetch for a given interval started or
 * cleared its loading flag.
 *
 * @param interval  - Number of days the fetch covers.
 * @param [loading] - Loading flag.
 * @return Action object.
 */
export function fetchTrafficReferrers( interval: TrafficInterval, loading = true ) {
	return {
		type: FETCH_TRAFFIC_REFERRERS,
		interval,
		loading,
	};
}

/**
 * Receive a referrers payload keyed by date.
 *
 * @param interval - Number of days the payload covers.
 * @param days     - Per-day referrer rows keyed by `YYYY-MM-DD`.
 * @return Action object.
 */
export function receiveTrafficReferrers(
	interval: TrafficInterval,
	days: Record< string, TrafficReferrerDay >
) {
	return {
		type: RECEIVE_TRAFFIC_REFERRERS,
		interval,
		days,
	};
}

/**
 * Flag the referrers fetch for a given interval as failed so the card
 * can distinguish a request error from a successful-but-empty window.
 *
 * @param interval - Number of days the failed fetch covered.
 * @return Action object.
 */
export function receiveTrafficReferrersError( interval: TrafficInterval ) {
	return {
		type: RECEIVE_TRAFFIC_REFERRERS_ERROR,
		interval,
	};
}

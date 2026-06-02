import {
	FETCH_TRAFFIC_REFERRERS,
	RECEIVE_TRAFFIC_REFERRERS,
	RECEIVE_TRAFFIC_REFERRERS_ERROR,
	SET_TRAFFIC_INTERVAL,
} from '../actions/constants';
import {
	fetchTrafficReferrers,
	receiveTrafficReferrers,
	receiveTrafficReferrersError,
	setTrafficInterval,
} from '../actions/traffic-stats';
import { SocialStoreState, TrafficStatsState } from '../types';

type Action =
	| ReturnType<
			| typeof setTrafficInterval
			| typeof fetchTrafficReferrers
			| typeof receiveTrafficReferrers
			| typeof receiveTrafficReferrersError
	  >
	| { type: 'default' };

const INITIAL_STATE: TrafficStatsState = { interval: 30 };

/**
 * Traffic-stats reducer — owns the active interval selection and the
 * cached referrers payload keyed by interval. Caching by interval lets
 * a 7 → 30 → 7 toggle reuse the already-fetched 7-day window without
 * round-tripping the API.
 *
 * @param state  - State slice.
 * @param action - Dispatched action.
 *
 * @return The next state slice.
 */
export function trafficStats(
	state: SocialStoreState[ 'trafficStats' ] = INITIAL_STATE,
	action: Action
): SocialStoreState[ 'trafficStats' ] {
	switch ( action.type ) {
		case SET_TRAFFIC_INTERVAL:
			return { ...state, interval: action.interval };
		case FETCH_TRAFFIC_REFERRERS:
			return {
				...state,
				byInterval: {
					...state?.byInterval,
					[ action.interval ]: {
						...state?.byInterval?.[ action.interval ],
						loading: action.loading,
						// Clear any prior error when a fresh fetch starts.
						error: false,
					},
				},
			};
		case RECEIVE_TRAFFIC_REFERRERS:
			return {
				...state,
				byInterval: {
					...state?.byInterval,
					[ action.interval ]: {
						loading: false,
						error: false,
						days: action.days,
					},
				},
			};
		case RECEIVE_TRAFFIC_REFERRERS_ERROR:
			return {
				...state,
				byInterval: {
					...state?.byInterval,
					[ action.interval ]: {
						...state?.byInterval?.[ action.interval ],
						loading: false,
						error: true,
					},
				},
			};
	}
	return state;
}

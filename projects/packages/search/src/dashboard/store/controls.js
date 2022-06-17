import restApi from '@automattic/jetpack-api';

export const FETCH_JETPACK_SETTINGS = 'FETCH_JETPACK_SETTINGS';
export const UPDATE_JETPACK_SETTINGS = 'UPDATE_JETPACK_SETTINGS';
export const FETCH_SEARCH_PLAN_INFO = 'FETCH_SEARCH_PLAN_INFO';
export const FETCH_SEARCH_STATS = 'FETCH_SEARCH_STATS';
export const FETCH_SEARCH_PRICING = 'FETCH_SEARCH_PRICING';

/**
 * fetchJetpackSettings action
 *
 * @returns {object} - an action object.
 */
export const fetchJetpackSettings = () => {
	return {
		type: FETCH_JETPACK_SETTINGS,
	};
};

/**
 * updateJetpackSettings action
 *
 * @param {*} settings - Jetpack settings object.
 * @returns {object} - an action object.
 */
export const updateJetpackSettings = settings => {
	return {
		type: UPDATE_JETPACK_SETTINGS,
		settings,
	};
};

/**
 * fetchSearchPlanInfo action
 *
 * @yields {object} - an action object.
 * @returns {object} - an search plan object.
 */
export function* fetchSearchPlanInfo() {
	const response = yield {
		type: FETCH_SEARCH_PLAN_INFO,
	};
	return response;
}

/**
 * fetchSearchStats action
 *
 * @returns {object} - an action object.
 */
export const fetchSearchStats = () => {
	return {
		type: FETCH_SEARCH_STATS,
	};
};

/**
 * fetchSearchPricing action
 *
 * @returns {object} - an action object.
 */
export const fetchSearchPricing = () => {
	return {
		type: FETCH_SEARCH_PRICING,
	};
};

export default {
	[ FETCH_JETPACK_SETTINGS ]: function () {
		return restApi.fetchSearchSettings();
	},
	[ UPDATE_JETPACK_SETTINGS ]: function ( action ) {
		return restApi.updateSearchSettings( action.settings );
	},
	[ FETCH_SEARCH_PLAN_INFO ]: function () {
		return restApi.fetchSearchPlanInfo();
	},
	[ FETCH_SEARCH_STATS ]: function () {
		return restApi.fetchSearchStats();
	},
	[ FETCH_SEARCH_PRICING ]: function () {
		return restApi.fetchSearchPricing();
	},
};

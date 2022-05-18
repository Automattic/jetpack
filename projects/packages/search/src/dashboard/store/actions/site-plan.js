export const SET_SEARCH_PLAN_INFO = 'SET_SEARCH_PLAN_INFO';
export const FETCH_SEARCH_PLAN_INFO = 'FETCH_SEARCH_PLAN_INFO';

/**
 * Action to set plan info
 *
 * @param {*} options - plan info.
 * @returns {object} - an action object.
 */
export function setSearchPlanInfo( options ) {
	return {
		type: 'SET_SEARCH_PLAN_INFO',
		options,
	};
}

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

export default { setSearchPlanInfo, fetchSearchPlanInfo };

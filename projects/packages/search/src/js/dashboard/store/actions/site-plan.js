export const SET_SEARCH_PLAN_INFO = 'SET_SEARCH_PLAN_INFO';

export function setSearchPlanInfo( options ) {
	return {
		type: 'SET_SEARCH_PLAN_INFO',
		options,
	};
}

export default { setSearchPlanInfo };

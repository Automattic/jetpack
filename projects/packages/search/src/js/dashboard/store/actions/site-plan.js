export const SET_SEARCH_PLAN_INFO = 'SET_SEARCH_PLAN_INFO';

function setSearchPlanInfo( options ) {
	return {
		type: 'SET_SEARCH_PLAN_INFO',
		options,
	};
}

export default { setSearchPlanInfo };

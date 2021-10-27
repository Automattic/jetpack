import restApi from '@automattic/jetpack-api';

export const FETCH_JETPACK_SETTINGS = 'FETCH_JETPACK_SETTINGS';
export const UPDATE_JETPACK_SETTINGS = 'UPDATE_JETPACK_SETTINGS';
export const FETCH_SEARCH_PLAN_INFO = 'FETCH_SEARCH_PLAN_INFO';

export const fetchJetpackSettings = () => {
	return {
		type: FETCH_JETPACK_SETTINGS,
	};
};

export const updateJetpackSettings = settings => {
	return {
		type: UPDATE_JETPACK_SETTINGS,
		settings,
	};
};

export const fetchSearchPlanInfo = () => {
	return {
		type: FETCH_SEARCH_PLAN_INFO,
	};
};

export default {
	[ FETCH_JETPACK_SETTINGS ]: function () {
		return restApi.fetchSettings();
	},
	[ UPDATE_JETPACK_SETTINGS ]: function ( action ) {
		return restApi.updateSettings( action.settings );
	},
	[ FETCH_SEARCH_PLAN_INFO ]: function () {
		return restApi.fetchSearchPlanInfo();
	},
};

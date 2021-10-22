import restApi from '@automattic/jetpack-api';

export const FETCH_JETPACK_SETTINGS = 'FETCH_JETPACK_SETTINGS';
export const UPDATE_JETPACK_SETTINGS = 'UPDATE_JETPACK_SETTINGS';

export const fetchJetpackSetttings = () => {
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

export default {
	[ FETCH_JETPACK_SETTINGS ]: function () {
		return restApi.fetchSettings();
	},
	[ UPDATE_JETPACK_SETTINGS ]: function ( action ) {
		return restApi.updateSettings( action.settings );
	},
};

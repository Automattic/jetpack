import apiFetch from '@wordpress/api-fetch';

export const FETCH_JETPACK_SETTINGS = 'FETCH_JETPACK_SETTINGS';
export const UPDATE_JETPACK_SETTINGS = 'UPDATE_JETPACK_SETTINGS';

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

export default {
	[ FETCH_JETPACK_SETTINGS ]: function () {
		return apiFetch( { path: '/jetpack/v4/social/settings' } );
	},
	[ UPDATE_JETPACK_SETTINGS ]: function ( action ) {
		return apiFetch( {
			path: '/jetpack/v4/social/settings',
			method: 'POST',
			data: action.settings,
		} );
	},
};

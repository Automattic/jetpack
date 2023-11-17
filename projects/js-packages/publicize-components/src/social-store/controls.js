import apiFetch from '@wordpress/api-fetch';

export const FETCH_JETPACK_SETTINGS = 'FETCH_JETPACK_SETTINGS';
export const UPDATE_JETPACK_SETTINGS = 'UPDATE_JETPACK_SETTINGS';
export const FETCH_SOCIAL_IMAGE_GENERATOR_SETTINGS = 'FETCH_SOCIAL_IMAGE_GENERATOR_SETTINGS';
export const UPDATE_SOCIAL_IMAGE_GENERATOR_SETTINGS = 'UPDATE_SOCIAL_IMAGE_GENERATOR_SETTINGS';

export const FETCH_AUTO_CONVERSION_SETTINGS = 'FETCH_AUTO_CONVERSION_SETTINGS';
export const UPDATE_AUTO_CONVERSION_SETTINGS = 'UPDATE_AUTO_CONVERSION_SETTINGS';

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
 * fetchSocialImageGeneratorSettings action
 *
 * @returns {object} - an action object.
 */
export const fetchSocialImageGeneratorSettings = () => {
	return {
		type: FETCH_SOCIAL_IMAGE_GENERATOR_SETTINGS,
	};
};

/**
 * updateSocialImageGeneratorSettings action
 *
 * @param {*} settings - Social Image Generator settings object.
 * @returns {object} - an action object.
 */
export const updateSocialImageGeneratorSettings = settings => {
	return {
		type: UPDATE_SOCIAL_IMAGE_GENERATOR_SETTINGS,
		settings,
	};
};

/**
 * fetchAutoConversionSettings action
 *
 * @returns {object} - an action object.
 */
export const fetchAutoConversionSettings = () => {
	return {
		type: FETCH_AUTO_CONVERSION_SETTINGS,
	};
};

/**
 * updateAutoConversionSettings action
 *
 * @param {*} settings - Auto conversion settings object.
 * @returns {object} - an action object.
 */
export const updateAutoConversionSettings = settings => {
	return {
		type: UPDATE_AUTO_CONVERSION_SETTINGS,
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
	[ FETCH_SOCIAL_IMAGE_GENERATOR_SETTINGS ]: function () {
		return apiFetch( { path: '/jetpack/v4/social-image-generator/settings' } );
	},
	[ UPDATE_SOCIAL_IMAGE_GENERATOR_SETTINGS ]: function ( action ) {
		return apiFetch( {
			path: '/jetpack/v4/social-image-generator/settings',
			method: 'POST',
			data: action.settings,
		} );
	},
	[ FETCH_AUTO_CONVERSION_SETTINGS ]: function () {
		return apiFetch( { path: '/jetpack/v4/auto-conversion/settings' } );
	},
	[ UPDATE_AUTO_CONVERSION_SETTINGS ]: function ( action ) {
		return apiFetch( {
			path: '/jetpack/v4/auto-conversion/settings',
			method: 'POST',
			data: action.settings,
		} );
	},
};
